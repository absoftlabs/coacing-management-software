// src/lib/sms/smsNetClient.ts
// SMS sending client for https://api.sms.net.bd

export type SmsSendResponse =
    | { ok: true; requestId: string }
    | { ok: false; errorMessage: string };

const BASE_URL = "https://api.sms.net.bd";

/**
 * Normalize Bangladeshi phone number to 8801XXXXXXXXX format.
 */
function normalizePhone(number: string): string {
    const n = number.trim().replace(/\D+/g, "");
    if (/^8801\d{9}$/.test(n)) return n;
    if (/^01\d{9}$/.test(n)) return "880" + n;
    return n;
}

/**
 * Send an SMS via GET request
 */
export async function sendSmsNetBd(
    to: string | string[],
    message: string,
    senderId?: string
): Promise<SmsSendResponse> {
    const apiKey = process.env.SMS_API;
    if (!apiKey) return { ok: false, errorMessage: "SMS_API missing in .env.local" };

    const recipients = (Array.isArray(to) ? to : [to])
        .map(normalizePhone)
        .filter(Boolean)
        .join(",");

    const url = new URL(`${BASE_URL}/sendsms`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("msg", message);
    url.searchParams.set("to", recipients);
    if (senderId) url.searchParams.set("sender_id", senderId);

    try {
        const res = await fetch(url.toString());
        const json = await res.json();

        if (json.error === 0 && json?.data?.request_id) {
            return { ok: true, requestId: String(json.data.request_id) };
        } else {
            return { ok: false, errorMessage: json.msg || "Unknown provider error" };
        }
    } catch (err) {
        return { ok: false, errorMessage: String(err) };
    }
}

/**
 * Get current SMS balance
 */
export async function getSmsBalance(): Promise<string> {
    const apiKey = process.env.SMS_API;
    if (!apiKey) throw new Error("SMS_API not configured");
    const res = await fetch(`${BASE_URL}/user/balance/?api_key=${apiKey}`);
    const json = await res.json();
    if (json.error !== 0) throw new Error(json.msg);
    return json.data?.balance ?? "0.0000";
}
