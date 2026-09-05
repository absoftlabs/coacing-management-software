import { NextRequest, NextResponse } from "next/server";
import { getBulkSmsBalance } from "@/lib/sms/bulkSmsClient";

// POST /api/settings/check-sms  body: { apiKey }
// Lets the admin verify an API key works (and see the balance) before saving it.
export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as { apiKey?: string } | null;
    const apiKey = body?.apiKey?.trim();
    if (!apiKey) {
        return NextResponse.json({ error: "API key required" }, { status: 400 });
    }

    const res = await getBulkSmsBalance(apiKey);
    if (!res.ok) {
        return NextResponse.json({ error: res.errorMessage || "Failed to check balance" }, { status: 400 });
    }
    return NextResponse.json({ balance: res.balance });
}
