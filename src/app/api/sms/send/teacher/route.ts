// src/app/api/sms/send/teacher/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sendSmsNetBd } from "@/lib/sms/smsNetClient";
import type { SmsLogDoc } from "@/lib/sms/types";

type TeacherDocDb = {
    _id?: ObjectId;          // Mongo ObjectId (typical)
    teacherId?: string;      // Optional string id (if you used your own id)
    name: string;
    phone?: string;          // any of these may exist in your DB
    mobile?: string;
    phoneNumber?: string;
    subject?: string;
    status?: "active" | "suspended";
};

function pickPhone(t: TeacherDocDb): string | undefined {
    return t.phone?.trim() || t.mobile?.trim() || t.phoneNumber?.trim();
}

export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as {
        teacher_scope: "ALL" | "INDIVIDUAL";
        teacher_id?: string;     // may be an ObjectId string OR teacherId (custom)
        custom_sms: string;
        senderId?: string;       // optional sender id
    } | null;

    if (!body?.custom_sms) {
        return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const db = await getDb();
    let teachers: TeacherDocDb[] = [];

    // Build base filter (exclude suspended by default)
    const baseFilter: Record<string, unknown> = { status: { $ne: "suspended" } };

    if (body.teacher_scope === "INDIVIDUAL" && body.teacher_id) {
        // Try by ObjectId _id first
        if (ObjectId.isValid(body.teacher_id)) {
            const t = await db
                .collection<TeacherDocDb>("teachers")
                .findOne({ ...baseFilter, _id: new ObjectId(body.teacher_id) });
            if (t) teachers = [t];
        }

        // If not found by _id, try matching teacherId (custom string id)
        if (!teachers.length) {
            const t2 = await db
                .collection<TeacherDocDb>("teachers")
                .findOne({ ...baseFilter, teacherId: body.teacher_id });
            if (t2) teachers = [t2];
        }
    } else {
        // ALL teachers
        teachers = await db
            .collection<TeacherDocDb>("teachers")
            .find(baseFilter)
            .toArray();
    }

    // Debug log
    console.log("[sms/send/teacher] loaded:", teachers.length);

    if (!teachers.length) {
        // 404 keeps your UI's "❌ No teachers found" flow
        return NextResponse.json({ error: "No teachers found" }, { status: 404 });
    }

    const colLog = db.collection<Required<SmsLogDoc>>("sms_log");
    const sent: Array<{ teacher: string; phone: string; status: string }> = [];

    for (const t of teachers) {
        const phone = pickPhone(t);
        if (!phone) {
            sent.push({ teacher: t.name, phone: "", status: "skip-no-phone" });
            continue;
        }

        const res = await sendSmsNetBd(phone, body.custom_sms, body.senderId);

        const log: SmsLogDoc = {
            audience: "teacher",
            teacherId: (t.teacherId ?? (t._id ? t._id.toHexString() : "")) || "",
            preview: body.custom_sms,
            phone,
            status: res.ok ? "sent" : "failed",
            providerId: res.requestId ?? "",
            sentAt: new Date().toISOString(),
            error: res.errorMessage ?? "",
        };

        await colLog.insertOne(log as Required<SmsLogDoc>);
        sent.push({ teacher: t.name, phone, status: res.ok ? "sent" : "failed" });
    }

    return NextResponse.json({ ok: true, count: sent.length, items: sent });
}
