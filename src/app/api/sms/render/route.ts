// src/app/api/sms/render/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SubjectMark = {
    className: string;
    mcqTotal?: number;
    mcqGain?: number;
    quesTotal?: number;
    quesGain?: number;
    totalMarks?: number;
    totalGain?: number;
};

type ResultDoc = {
    _id: string;
    batch: string;
    studentId: string;
    studentName: string;
    resultType: string;
    examDate?: string;
    subjects: SubjectMark[];
    totalMarks?: number;
    totalGain?: number;
};

type StudentDoc = {
    _id: string;
    studentId: string;
    name: string;
    batch: string;
    roll?: string;
};

type PreviewBody = {
    template: string;
    coachingName?: string;
    studentId?: string;
    resultId?: string;
};

function replaceAllLiteral(input: string, find: string, replace: string): string {
    return input.split(find).join(replace);
}

function formatSubjectsList(subjects: SubjectMark[]): string {
    return subjects
        .map((s) => {
            const t = s.totalMarks ?? ((s.mcqTotal ?? 0) + (s.quesTotal ?? 0));
            const g = s.totalGain ?? ((s.mcqGain ?? 0) + (s.quesGain ?? 0));
            return `${s.className}-${g}/${t}`;
        })
        .join(", ");
}

function renderTemplate(template: string, ctx: {
    coachingName?: string;
    student?: Pick<StudentDoc, "name" | "studentId" | "roll" | "batch">;
    result?: ResultDoc;
}): string {
    let out = template;

    out = replaceAllLiteral(out, "[coaching-name]", ctx.coachingName ?? "");

    const studentName = ctx.student?.name ?? "";
    const studentId = ctx.student?.studentId ?? "";
    const studentRoll = ctx.student?.roll ?? "";
    out = replaceAllLiteral(out, "[student-name]", studentName);
    out = replaceAllLiteral(out, "[student-id]", studentId);
    out = replaceAllLiteral(out, "[student-roll]", studentRoll);

    const result = ctx.result;
    if (result) {
        const overallTotal = result.totalMarks ?? result.subjects.reduce((acc, s) => acc + (s.totalMarks ?? 0), 0);
        const overallGain = result.totalGain ?? result.subjects.reduce((acc, s) => acc + (s.totalGain ?? 0), 0);

        out = replaceAllLiteral(out, "[gain-mark/total-mark]", `${overallGain}/${overallTotal}`);
        out = replaceAllLiteral(out, "[exam-type]", result.resultType ?? "");
        out = replaceAllLiteral(out, "[exam-date]", result.examDate ?? "");

        const first = result.subjects[0];
        out = replaceAllLiteral(out, "[subject]", first?.className ?? "");
        out = replaceAllLiteral(out, "[subjects]", formatSubjectsList(result.subjects));
    } else {
        out = replaceAllLiteral(out, "[gain-mark/total-mark]", "");
        out = replaceAllLiteral(out, "[exam-type]", "");
        out = replaceAllLiteral(out, "[exam-date]", "");
        out = replaceAllLiteral(out, "[subject]", "");
        out = replaceAllLiteral(out, "[subjects]", "");
    }

    return out.trim();
}

// POST /api/sms/render -> returns { preview, context }
export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as PreviewBody | null;
    if (!body || typeof body.template !== "string" || !body.template.trim()) {
        return NextResponse.json({ error: "Invalid payload: 'template' is required" }, { status: 400 });
    }

    const ctx: {
        coachingName?: string;
        student?: Pick<StudentDoc, "name" | "studentId" | "roll" | "batch">;
        result?: ResultDoc;
    } = {
        coachingName: body.coachingName ?? "Prottasha Coaching Center",
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
                resultType: r.resultType,
                examDate: r.examDate ? r.examDate.toISOString() : undefined,
                subjects: r.subjects,
                totalMarks: r.totalMarks,
                totalGain: r.totalGain,
            };
        }
    }

    const preview = renderTemplate(body.template, ctx);

    return NextResponse.json({ ok: true, preview, context: ctx });
}
