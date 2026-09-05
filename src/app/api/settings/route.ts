import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings";

// GET /api/settings
export async function GET() {
    try {
        const settings = await getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error("GET /api/settings error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/settings  body: { orgLogo?, smsApiKey?, smsSenderId? }
export async function PATCH(req: NextRequest) {
    try {
        const body = (await req.json().catch(() => null)) as
            | { orgLogo?: string | null; smsApiKey?: string | null; smsSenderId?: string | null }
            | null;
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const data: { orgLogo?: string | null; smsApiKey?: string | null; smsSenderId?: string | null } = {};
        if (Object.prototype.hasOwnProperty.call(body, "orgLogo")) {
            data.orgLogo = body.orgLogo ? String(body.orgLogo) : null;
        }
        if (Object.prototype.hasOwnProperty.call(body, "smsApiKey")) {
            data.smsApiKey = body.smsApiKey ? String(body.smsApiKey).trim() : null;
        }
        if (Object.prototype.hasOwnProperty.call(body, "smsSenderId")) {
            data.smsSenderId = body.smsSenderId ? String(body.smsSenderId).trim() : null;
        }

        const updated = await saveSettings(data);
        return NextResponse.json({
            orgLogo: updated.orgLogo,
            smsApiKey: updated.smsApiKey,
            smsSenderId: updated.smsSenderId,
        });
    } catch (error) {
        console.error("PATCH /api/settings error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
