// src/lib/sms/smsNetClient.ts
import { URLSearchParams } from "url";

export type SmsSendResult = {
    ok: boolean;
    requestId?: string;
    errorCode?: number;
    errorMessage?: string;
};

export type SmsReportResult = {
    ok: boolean;
    status?: string;      // "Complete" | ...
    recipients?: Array<{ number: string; status: string; charge: string }>;
    errorMessage?: string;
    raw?: unknown;
};

export type SmsReportApiResponse = {
    error: number;
    msg?: string;
    data?: {
        request_status?: string;
        recipients?: Array<{ number: string; status: string; charge: string }>;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

const BASE = "https://api.sms.net.bd/sendsms";

function getApiKey(): string {
    const key = process.env.SMS_API_KEY || process.env.SMS_API;
    if (!key) throw new Error("Missing SMS API key");
    return key;
}


// 01XXXXXXXXX / 8801XXXXXXXXX → 8801XXXXXXXXX
export function normalizeBdPhone(input: string): string | null {
    const raw = (input || "").replace(/[^\d]/g, "");
    if (!raw) return null;

    // already 8801XXXXXXXXX
    if (raw.length === 13 && raw.startsWith("8801")) return raw;

    // 01XXXXXXXXX -> 8801XXXXXXXXX
    if (raw.length === 11 && raw.startsWith("01")) return "88" + raw;

    // fallback: if starts with 1 and total 10 digits (rare), reject
    return null;
}

const API_URL = "https://api.sms.net.bd/sendsms";

export async function sendSmsNetBd(
    to: string,
    msg: string,
    senderId?: string
): Promise<{ ok: boolean; requestId?: string; errorMessage?: string }> {
    try {
        const apiKey = process.env.SMS_API;
        if (!apiKey) throw new Error("Missing SMS_API key in .env.local");

        const params = new URLSearchParams({
            api_key: apiKey,
            msg,
            to,
        });

        if (senderId) params.append("sender_id", senderId);

        const res = await fetch(`${API_URL}?${params.toString()}`, {
            method: "GET",
        });

        const data = await res.json().catch(() => ({}));

        if (data.error === 0) {
            return {
                ok: true,
                requestId: data?.data?.request_id?.toString(),
            };
        } else {
            return {
                ok: false,
                errorMessage: data.msg || "SMS sending failed",
            };
        }
    } catch (e: unknown) {
        return {
            ok: false,
            errorMessage: e instanceof Error ? e.message : "Network error",
        };
    }
}


export async function getSmsBalance(): Promise<string> {
    const api_key = getApiKey();
    const url = `${BASE}/user/balance/?api_key=${encodeURIComponent(api_key)}`;
    const res = await fetch(url, { method: "GET" });
    const json = (await res.json().catch(() => ({}))) as {
        error?: number;
        data?: { balance?: string } | null;
        [key: string]: unknown;
    };
    if (json?.error === 0) return String(json?.data?.balance ?? "0.00");
    return "0.00";
}

export async function getSmsReport(requestId: string): Promise<SmsReportResult> {
    try {
        const api_key = getApiKey();
        const url = `${BASE}/report/request/${encodeURIComponent(requestId)}/?api_key=${encodeURIComponent(api_key)}`;

        const res = await fetch(url, { method: "GET" });
        if (!res.ok) {
            return {
                ok: false,
                errorMessage: `HTTP ${res.status}`,
            };
        }

        const json: SmsReportApiResponse = await res.json();

        if (json.error === 0 && json.data) {
            return {
                ok: true,
                status: json.data.request_status,
                recipients: json.data.recipients ?? [],
                raw: json,
            };
        }

        return {
            ok: false,
            errorMessage: json.msg || "Unknown report error",
            raw: json,
        };
    } catch (e: unknown) {
        let errMsg = "Network error";
        if (e instanceof Error) errMsg = e.message;
        else if (typeof e === "string") errMsg = e;
        return { ok: false, errorMessage: errMsg };
    }
}
