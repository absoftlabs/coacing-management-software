// src/app/api/sms/send/student/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type OptionalUnlessRequiredId, type Filter } from "mongodb";
import { renderTemplate } from "@/lib/sms/renderTemplate";
import { sendSmsNetBd } from "@/lib/sms/smsNetClient";
import type { SmsLogDoc, SmsTemplateDoc, SmsStatus } from "@/lib/sms/types";
import type { ResultDoc } from "@/lib/types";

type StudentDoc = {
    _id: ObjectId;
    studentId: string;
    name: string;
    roll?: string;
    batch?: string;
    guardianPhone?: string;
};

type SmsTemplateDb = Required<SmsTemplateDoc>;
type SmsLogDb = SmsLogDoc & { _id: ObjectId };

// DB-facing type: _id must be ObjectId for Mongo filters
type ResultDocDb = Omit<ResultDoc, "_id"> & { _id: ObjectId };

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
    if (!ObjectId.isValid(body.templateId) || !ObjectId.isValid(body.resultId)) {
        return NextResponse.json(
            { error: "Invalid templateId or resultId" },
            { status: 400 }
        );
    }

    const db = await getDb();

    // Template (DB type where _id is ObjectId)
    const template = await db
        .collection<SmsTemplateDb>("sms_templates")
        .findOne({ _id: new ObjectId(body.templateId) });
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    // Result (use ResultDocDb so _id is ObjectId in the filter)
    const resultDb = await db
        .collection<ResultDocDb>("results")
        .findOne({ _id: new ObjectId(body.resultId) } as Filter<ResultDocDb>);
    if (!resultDb) return NextResponse.json({ error: "Result not found" }, { status: 404 });

    // Map DB shape to your app shape (ResultDoc)
    // (If your ResultDoc uses _id?: ObjectId, this is already compatible.)
    const result: ResultDoc = {
        ...resultDb,
        _id: resultDb._id.toHexString(),
    };

    // Resolve students
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

    const colLog = db.collection<SmsLogDb>("sms_log");
    const sent: Array<{ studentId: string; phone: string; status: string }> = [];

    for (const s of students) {
        const phone = s.guardianPhone?.trim();
        if (!phone) {
            sent.push({ studentId: s.studentId, phone: "", status: "skip-no-phone" });
            continue;
        }

        const msg = renderTemplate(template.templateBody, {
            coachingName: body.coachingName ?? "Prottasha Coaching Center",
            student: { name: s.name, studentId: s.studentId, roll: s.roll, batch: s.batch },
            result,
        });

        const res = await sendSmsNetBd(phone, msg, body.senderId);

        const log = {
            audience: "student" as const,
            batchId: s.batch,
            studentId: s.studentId,
            templateId: template._id.toHexString(),
            preview: msg,
            phone,
            status: res.ok ? ("sent" as SmsStatus) : ("failed" as SmsStatus),
            providerId: res.ok ? res.requestId : undefined,
            sentAt: new Date().toISOString(),
            error: res.ok ? undefined : res.errorMessage,
        };

        await colLog.insertOne(log as OptionalUnlessRequiredId<SmsLogDb>);
        sent.push({ studentId: s.studentId, phone, status: res.ok ? "sent" : "failed" });
    }

    return NextResponse.json({ ok: true, count: sent.length, items: sent });
}
