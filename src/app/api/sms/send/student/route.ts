// src/app/api/sms/send/student/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type OptionalUnlessRequiredId, type Filter } from "mongodb";
import { renderTemplate } from "@/lib/sms/renderTemplate";
import { sendSmsNetBd } from "@/lib/sms/smsNetClient";
import type { SmsLogDoc, SmsTemplateDoc } from "@/lib/sms/types";
import type { ResultDoc } from "@/lib/types";

type StudentDoc = {
    _id: ObjectId;
    studentId: string;
    name: string;
    roll?: string;
    batch?: string;
    guardianPhone?: string;
};

export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as {
        batchId: string;
        studentId?: string;
        templateId: string;
        resultId: string;
        coachingName?: string;
        senderId?: string;
    } | null;

    if (!body?.batchId || !body.templateId || !body.resultId) {
        return NextResponse.json(
            { error: "batchId, templateId, resultId required" },
            { status: 400 }
        );
    }

    const db = await getDb();

    const template = await db
        .collection<Required<SmsTemplateDoc>>("sms_templates")
        .findOne({ _id: new ObjectId(body.templateId) });
    if (!template)
        return NextResponse.json({ error: "Template not found" }, { status: 404 });

    const result = await db
        .collection<ResultDoc>("results")
        .findOne({ _id: new ObjectId(body.resultId) } as unknown as Filter<ResultDoc>);
    if (!result)
        return NextResponse.json({ error: "Result not found" }, { status: 404 });

    let students: StudentDoc[] = [];
    if (body.studentId) {
        const s = await db
            .collection<StudentDoc>("students")
            .findOne({ studentId: body.studentId, batch: body.batchId });
        if (s) students = [s];
    } else {
        students = await db
            .collection<StudentDoc>("students")
            .find({ batch: body.batchId })
            .toArray();
    }

    if (!students.length) {
        return NextResponse.json({ error: "No students found" }, { status: 404 });
    }

    const colLog = db.collection<Required<SmsLogDoc>>("sms_log");
    const sent: Array<{ studentId: string; phone: string; status: string }> = [];

    for (const s of students) {
        const phone = s.guardianPhone?.trim();
        if (!phone) {
            sent.push({ studentId: s.studentId, phone: "", status: "skip-no-phone" });
            continue;
        }

        const msg = renderTemplate(template.templateBody, {
            coachingName: body.coachingName ?? "Your Coaching",
            student: {
                name: s.name,
                studentId: s.studentId,
                roll: s.roll,
                batch: s.batch,
            },
            result,
        });

        const res = await sendSmsNetBd(phone, msg, body.senderId);

        const log: OptionalUnlessRequiredId<SmsLogDoc> = {
            audience: "student",
            batchId: s.batch,
            studentId: s.studentId,
            templateId: template._id.toHexString(),
            preview: msg,
            phone,
            status: res.ok ? "sent" : "failed",
            providerId: res.requestId ?? "",
            sentAt: new Date().toISOString(),
            error: res.errorMessage ?? "",
        };
        await colLog.insertOne(log as Required<SmsLogDoc>);

        sent.push({
            studentId: s.studentId,
            phone,
            status: res.ok ? "sent" : "failed",
        });
    }

    const failed = sent.filter((x) => x.status !== "sent").length;
    return NextResponse.json({
        ok: failed === 0,
        count: sent.length,
        failed,
        items: sent,
    });
}
