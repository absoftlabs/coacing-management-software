// src/app/api/sms/render/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderTemplate } from "@/lib/sms/renderTemplate";
import type { RenderContext } from "@/lib/sms/types";
import type { ResultType } from "@/lib/types";
import { ORG_NAME } from "@/lib/org";

type PreviewBody = {
    template: string;
    coachingName?: string;
    studentId?: string;
    resultId?: string;
};

// POST /api/sms/render -> returns { preview, context }
// Uses the same renderTemplate() as the actual send routes, so a preview
// always matches what guardians/teachers will receive.
export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as PreviewBody | null;
    if (!body || typeof body.template !== "string" || !body.template.trim()) {
        return NextResponse.json({ error: "Invalid payload: 'template' is required" }, { status: 400 });
    }

    const ctx: RenderContext = {
        coachingName: body.coachingName ?? ORG_NAME,
    };

    if (body.studentId) {
        const s = await prisma.student.findUnique({
            where: { studentId: body.studentId },
            include: { batch: true },
        });
        if (s) {
            ctx.student = { name: s.name, studentId: s.studentId, roll: s.roll, batch: s.batch.name };
        }
    }

    const resultIdNum = body.resultId ? Number(body.resultId) : NaN;
    if (Number.isInteger(resultIdNum)) {
        const r = await prisma.result.findUnique({
            where: { id: resultIdNum },
            include: { batch: true, subjects: true },
        });
        if (r) {
            ctx.result = {
                _id: String(r.id),
                batch: r.batch.name,
                studentId: body.studentId ?? "",
                studentName: r.studentName,
                resultType: r.resultType as ResultType,
                examDate: r.examDate ? r.examDate.toISOString() : undefined,
                subjects: r.subjects,
                totalMarks: r.totalMarks,
                totalGain: r.totalGain,
                createdAt: r.createdAt.toISOString(),
                updatedAt: r.updatedAt.toISOString(),
            };
        }
    }

    const preview = renderTemplate(body.template, ctx);

    return NextResponse.json({ ok: true, preview, context: ctx });
}
