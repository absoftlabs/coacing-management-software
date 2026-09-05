// src/app/api/sms/send/teacher/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBulkSms } from "@/lib/sms/bulkSmsClient";
import { getSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json().catch(() => null)) as {
            teacher_scope: "ALL" | "INDIVIDUAL";
            teacher_id?: string; // teacher's numeric id (as string) OR its teacherCode
            custom_sms: string;
            senderId?: string;
        } | null;

        if (!body?.custom_sms) {
            return NextResponse.json({ error: "Message required" }, { status: 400 });
        }

        let teachers: { id: number; teacherCode: string | null; name: string; phone: string | null }[] = [];

        if (body.teacher_scope === "INDIVIDUAL" && body.teacher_id) {
            const idNum = Number(body.teacher_id);
            if (Number.isInteger(idNum)) {
                const t = await prisma.teacher.findFirst({ where: { id: idNum, isSuspended: false } });
                if (t) teachers = [t];
            }
            if (!teachers.length) {
                const t2 = await prisma.teacher.findFirst({
                    where: { teacherCode: body.teacher_id, isSuspended: false },
                });
                if (t2) teachers = [t2];
            }
        } else {
            teachers = await prisma.teacher.findMany({ where: { isSuspended: false } });
        }

        if (!teachers.length) {
            return NextResponse.json({ error: "No teachers found" }, { status: 404 });
        }

        const settings = await getSettings();
        if (!settings.smsApiKey || !settings.smsSenderId) {
            return NextResponse.json(
                { error: "SMS API key/Sender ID not configured. Set it in Settings." },
                { status: 400 }
            );
        }

        const sent: Array<{ teacher: string; phone: string; status: string }> = [];

        for (const t of teachers) {
            const phone = t.phone?.trim();
            if (!phone) {
                sent.push({ teacher: t.name, phone: "", status: "skip-no-phone" });
                continue;
            }

            const res = await sendBulkSms(phone, body.custom_sms, settings.smsApiKey, body.senderId || settings.smsSenderId);

            await prisma.smsLog.create({
                data: {
                    audience: "teacher",
                    teacherId: t.teacherCode ?? String(t.id),
                    preview: body.custom_sms,
                    phone,
                    status: res.ok ? "sent" : "failed",
                    providerId: res.responseCode ? String(res.responseCode) : "",
                    sentAt: new Date(),
                    error: res.errorMessage ?? "",
                },
            });

            sent.push({ teacher: t.name, phone, status: res.ok ? "sent" : "failed" });
        }

        return NextResponse.json({ ok: true, count: sent.length, items: sent });
    } catch (error) {
        console.error("POST /api/sms/send/teacher error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
