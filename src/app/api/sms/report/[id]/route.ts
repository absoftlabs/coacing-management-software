// src/app/api/sms/report/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSmsReport } from "@/lib/sms/smsNetClient"; // ensure this exports getSmsReport

// GET /api/sms/report/:id
// NOTE: In this codebase, ctx.params is a Promise<{ id: string }>, so we await it.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;

    if (!id) {
        return NextResponse.json({ ok: false, error: "Missing request id" }, { status: 400 });
    }

    try {
        const report = await getSmsReport(id);
        // If provider says ok, 200; otherwise bubble as 502 Bad Gateway with provider message
        return NextResponse.json(report, { status: report.ok ? 200 : 502 });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}
