// src/app/api/sms/report/[id]/route.ts
import { NextResponse } from "next/server";
import { getSmsReport } from "@/lib/sms/smsNetClient";

export async function GET(_: Request, { params }: { params: { id: string } }) {
    const id = params.id;
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const rep = await getSmsReport(id);
    return NextResponse.json(rep, { status: rep.ok ? 200 : 502 });
}
