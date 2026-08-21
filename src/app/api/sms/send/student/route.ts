// src/app/api/sms/send/student/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderTemplate } from "@/lib/sms/renderTemplate";
import { sendSmsNetBd } from "@/lib/sms/smsNetClient";
import type { ResultType } from "@/lib/types";

export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as {
        batchId: string; // batch NAME, not a numeric id (matches historical field naming)
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

    const templateIdNum = Number(body.templateId);
    const resultIdNum = Number(body.resultId);
    if (!Number.isInteger(templateIdNum) || !Number.isInteger(resultIdNum)) {
        return NextResponse.json({ error: "Invalid templateId/resultId" }, { status: 400 });
    }

    const template = await prisma.smsTemplate.findUnique({ where: { id: templateIdNum } });
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    const result = await prisma.result.findUnique({
        where: { id: resultIdNum },
        include: { batch: true, subjects: true },
    });
    if (!result) return NextResponse.json({ error: "Result not found" }, { status: 404 });

    const resultForRender = {
        _id: String(result.id),
        batch: result.batch.name,
        studentId: "",
        studentName: result.studentName,
        resultType: result.resultType as ResultType,
        examDate: result.examDate ? result.examDate.toISOString() : undefined,
        subjects: result.subjects,
        totalMarks: result.totalMarks,
        totalGain: result.totalGain,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
    };

    let students: { id: number; studentId: string; name: string; roll: string; guardianPhone: string | null }[] = [];
    if (body.studentId) {
        const s = await prisma.student.findFirst({
            where: { studentId: body.studentId, batch: { name: body.batchId } },
        });
        if (s) students = [s];
    } else {
        students = await prisma.student.findMany({ where: { batch: { name: body.batchId } } });
    }

    if (!students.length) {
        return NextResponse.json({ error: "No students found" }, { status: 404 });
    }

    const sent: Array<{ studentId: string; phone: string; status: string }> = [];

    for (const s of students) {
        const phone = s.guardianPhone?.trim();
        if (!phone) {
            sent.push({ studentId: s.studentId, phone: "", status: "skip-no-phone" });
            continue;
        }

        const msg = renderTemplate(template.templateBody, {
            coachingName: body.coachingName ?? "Your Coaching",
            student: { name: s.name, studentId: s.studentId, roll: s.roll, batch: body.batchId },
            result: resultForRender,
        });

        const res = await sendSmsNetBd(phone, msg, body.senderId);

        await prisma.smsLog.create({
            data: {
                audience: "student",
                batchName: body.batchId,
                studentId: s.studentId,
                templateId: template.id,
                preview: msg,
                phone,
                status: res.ok ? "sent" : "failed",
                providerId: res.requestId ?? "",
                sentAt: new Date(),
                error: res.errorMessage ?? "",
            },
        });

        sent.push({ studentId: s.studentId, phone, status: res.ok ? "sent" : "failed" });
    }

    const failed = sent.filter((x) => x.status !== "sent").length;
    return NextResponse.json({
        ok: failed === 0,
        count: sent.length,
        failed,
        items: sent,
    });
}
