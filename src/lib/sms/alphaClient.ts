import type { AlphaSmsResponse } from "./types";

// Minimal Alpha SMS sender. If env missing, we just "queue" for dev.
export async function sendAlphaSms(to: string, message: string): Promise<AlphaSmsResponse> {
    const api = process.env.SMS_API;
    const apiKey = process.env.SMS_API_KEY;
    const sender = process.env.SMS_SENDER_ID;

    if (!api || !apiKey || !sender) {
        // dev fallback
        console.log("[alphaSms:dev] to=", to, "message=", message);
        return { ok: true, providerId: "dev-queued" };
    }

    try {
        const res = await fetch(api, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Adapt body to provider requirements if different:
            body: JSON.stringify({
                api_key: apiKey,
                sender_id: sender,
                to,
                message,
            }),
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            return { ok: false, error: `HTTP ${res.status} ${txt}` };
        }
        const j = (await res.json().catch(() => null)) as { success?: boolean; id?: string } | null;
        return j?.success ? { ok: true, providerId: j.id } : { ok: true }; // assume ok if no "success" field
    } catch (e) {
        return { ok: false, error: (e as Error).message };
    }
}
