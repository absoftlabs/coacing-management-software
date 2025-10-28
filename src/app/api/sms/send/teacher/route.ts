// src/app/api/sms/send/teacher/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { OptionalUnlessRequiredId } from "mongodb";
import type { SmsLogDoc } from "@/lib/sms/types";
import { sendSmsNetBd } from "@/lib/sms/smsNetClient";

type TeacherDoc = {
    _id: string;
    teacherId?: string;
    name: string;
    phone?: string;
};

type SmsLogDb = SmsLogDoc & { _id: string };

export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as {
        scope: "ALL" | "INDIVIDUAL";
        teacherId?: string;
        message: string;
        senderId?: string;
    } | null;

    if (!body?.message || !body.scope) {
        return NextResponse.json({ error: "scope and message required" }, { status: 400 });
    }

    const db = await getDb();
    let teachers: TeacherDoc[] = [];

    if (body.scope === "ALL") {
        teachers = await db.collection<TeacherDoc>("teachers").find({}).toArray();
    } else {
        if (!body.teacherId) {
            return NextResponse.json({ error: "teacherId required for INDIVIDUAL" }, { status: 400 });
        }
        const t = await db.collection<TeacherDoc>("teachers").findOne({ teacherId: body.teacherId });
        if (t) teachers = [t];
    }

    if (!teachers.length) return NextResponse.json({ error: "No teachers found" }, { status: 404 });

    const colLog = db.collection<OptionalUnlessRequiredId<SmsLogDoc>>("sms_log");
    const results: Array<{ teacherId?: string; phone: string; status: string }> = [];

    for (const t of teachers) {
        const phone = t.phone?.trim();
        if (!phone) {
            results.push({ teacherId: t.teacherId, phone: "", status: "skip-no-phone" });
            continue;
        }

        const res = await sendSmsNetBd(phone, body.message, body.senderId);

        const log: OptionalUnlessRequiredId<SmsLogDoc> = {
            audience: "teacher",
            teacherId: t.teacherId,
            preview: body.message,
            phone,
            status: res.ok ? "sent" : "failed",
            providerId: res.ok ? res.requestId : undefined,
            sentAt: new Date().toISOString(),
            error: res.ok ? undefined : res.errorMessage,
        };

        await colLog.insertOne(log);
        results.push({ teacherId: t.teacherId, phone, status: res.ok ? "sent" : "failed" });
    }

    return NextResponse.json({ ok: true, count: results.length, items: results });
}
