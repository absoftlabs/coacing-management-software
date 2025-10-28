// src/app/api/sms/render/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// ---- Client-facing types (you likely already have these in '@/lib/types') ----
// Keeping them local to make this file fully self-contained.
// If you already export them elsewhere, you can import instead.
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
    createdAt: string;
    updatedAt: string;
};

type StudentDoc = {
    _id: string;
    studentId: string;
    name: string;
    batch: string;
    roll?: string;
    guardianPhone?: string;
    fatherName?: string;
    motherName?: string;
    birthDate?: string;
    photoUrl?: string;
    createdAt: string;
    updatedAt: string;
};

// ---- DB shapes with ObjectId (used for Mongo operations) ----
type ResultDocDb = Omit<ResultDoc, "_id"> & { _id: ObjectId };
type StudentDocDb = Omit<StudentDoc, "_id"> & { _id: ObjectId };

// ---- Request body for preview ----
type PreviewBody = {
    template: string;            // the SMS template text with placeholders
    coachingName?: string;       // optional override for [coaching-name]
    studentId?: string;          // resolve student by its public code (e.g. PCC-xxxxx)
    resultId?: string;           // resolve result by Mongo ObjectId string
};

// ---- Utility: safe string replace (literal) ----
function replaceAllLiteral(input: string, find: string, replace: string): string {
    return input.split(find).join(replace);
}

// ---- Utility: build subjects string ("Physics-50/100, Chemistry-70/100") ----
function formatSubjectsList(subjects: SubjectMark[]): string {
    return subjects
        .map((s) => {
            const t = s.totalMarks ?? ((s.mcqTotal ?? 0) + (s.quesTotal ?? 0));
            const g = s.totalGain ?? ((s.mcqGain ?? 0) + (s.quesGain ?? 0));
            return `${s.className}-${g}/${t}`;
        })
        .join(", ");
}

// ---- Render the template with available context ----
function renderTemplate(template: string, ctx: {
    coachingName?: string;
    student?: Pick<StudentDoc, "name" | "studentId" | "roll" | "batch">;
    result?: ResultDoc;
}): string {
    let out = template;

    // Coaching name
    out = replaceAllLiteral(out, "[coaching-name]", ctx.coachingName ?? "");

    // Student fields
    const studentName = ctx.student?.name ?? "";
    const studentId = ctx.student?.studentId ?? "";
    const studentRoll = ctx.student?.roll ?? "";
    out = replaceAllLiteral(out, "[student-name]", studentName);
    out = replaceAllLiteral(out, "[student-id]", studentId);
    out = replaceAllLiteral(out, "[student-roll]", studentRoll);

    // Result fields
    const result = ctx.result;
    if (result) {
        const overallTotal = result.totalMarks ?? result.subjects.reduce((acc, s) => acc + (s.totalMarks ?? 0), 0);
        const overallGain = result.totalGain ?? result.subjects.reduce((acc, s) => acc + (s.totalGain ?? 0), 0);

        out = replaceAllLiteral(out, "[gain-mark/total-mark]", `${overallGain}/${overallTotal}`);
        out = replaceAllLiteral(out, "[exam-type]", result.resultType ?? "");
        out = replaceAllLiteral(out, "[exam-date]", result.examDate ?? "");

        // Single subject convenience (first subject if present)
        const first = result.subjects[0];
        out = replaceAllLiteral(out, "[subject]", first?.className ?? "");

        // Multi-subject list
        out = replaceAllLiteral(out, "[subjects]", formatSubjectsList(result.subjects));
    } else {
        // If result is missing, blank out result placeholders
        out = replaceAllLiteral(out, "[gain-mark/total-mark]", "");
        out = replaceAllLiteral(out, "[exam-type]", "");
        out = replaceAllLiteral(out, "[exam-date]", "");
        out = replaceAllLiteral(out, "[subject]", "");
        out = replaceAllLiteral(out, "[subjects]", "");
    }

    return out.trim();
}

// ---- POST /api/sms/render  -> returns { preview, context } ----
export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as PreviewBody | null;
    if (!body || typeof body.template !== "string" || !body.template.trim()) {
        return NextResponse.json({ error: "Invalid payload: 'template' is required" }, { status: 400 });
    }

    const db = await getDb();

    // Context we will use for rendering
    const ctx: {
        coachingName?: string;
        student?: Pick<StudentDoc, "name" | "studentId" | "roll" | "batch">;
        result?: ResultDoc;
    } = {
        coachingName: body.coachingName ?? "Prottasha Coaching Center",
    };

    // Resolve student by studentId (public code), not by _id
    if (body.studentId) {
        const s = await db
            .collection<StudentDocDb>("students")
            .findOne({ studentId: body.studentId });

        if (s) {
            ctx.student = {
                name: s.name,
                studentId: s.studentId,
                roll: s.roll,
                batch: s.batch,
                // we don't need other fields for SMS placeholders
            };
        }
    }

    // Resolve result by Mongo ObjectId (this is the line that needed fixing)
    if (body.resultId && ObjectId.isValid(body.resultId)) {
        const r = await db
            .collection<ResultDocDb>("results")
            .findOne({ _id: new ObjectId(body.resultId) });

        if (r) {
            // convert DB shape (_id: ObjectId) -> client shape (_id: string)
            const resultClient: ResultDoc = {
                ...r,
                _id: r._id.toString(),
            };
            ctx.result = resultClient;
        }
    }

    const preview = renderTemplate(body.template, ctx);

    return NextResponse.json({
        ok: true,
        preview,
        context: ctx,
    });
}
