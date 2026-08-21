// src/app/api/results/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { SubjectMark, ResultType } from "@/lib/types";
import { resolveBatchId, findStudentByCode } from "@/lib/dbHelpers";

const ALLOWED_TYPES: readonly ResultType[] = [
    "Class Test",
    "Weekly Test",
    "Quiz Test",
    "Model Test",
    "Custom",
];

function toNumber(v: unknown): number | undefined {
    if (v === null || v === undefined || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

function normalizeSubject(input: unknown): SubjectMark | null {
    if (typeof input !== "object" || input === null) return null;
    const o = input as Record<string, unknown>;

    const className = typeof o.className === "string" ? o.className.trim() : "";
    if (!className) return null;

    const mcqTotal = toNumber(o.mcqTotal) ?? 0;
    const mcqGain = toNumber(o.mcqGain) ?? 0;
    const quesTotal = toNumber(o.quesTotal) ?? 0;
    const quesGain = toNumber(o.quesGain) ?? 0;

    return {
        className,
        mcqTotal,
        mcqGain,
        quesTotal,
        quesGain,
        totalMarks: mcqTotal + quesTotal,
        totalGain: mcqGain + quesGain,
    };
}

function normalizePayload(json: unknown) {
    if (typeof json !== "object" || json === null) return null;
    const o = json as Record<string, unknown>;

    const batch = typeof o.batch === "string" ? o.batch.trim() : "";
    const studentId = typeof o.studentId === "string" ? o.studentId.trim() : "";
    const studentName = typeof o.studentName === "string" ? o.studentName.trim() : "";
    const resultType =
        typeof o.resultType === "string" && (ALLOWED_TYPES as readonly string[]).includes(o.resultType)
            ? (o.resultType as ResultType)
            : null;
    const examDate = typeof o.examDate === "string" ? o.examDate : undefined;

    if (!batch || !studentId || !studentName || !resultType) return null;

    const subjectsRaw = Array.isArray(o.subjects) ? o.subjects : null;
    if (!subjectsRaw || subjectsRaw.length === 0) return null;

    const subjects: SubjectMark[] = [];
    for (const s of subjectsRaw) {
        const ns = normalizeSubject(s);
        if (!ns) return null;
        subjects.push(ns);
    }

    return { batch, studentId, studentName, resultType, examDate, subjects };
}

function serialize(r: {
    id: number;
    batch: { name: string };
    student: { studentId: string };
    studentName: string;
    resultType: string;
    examDate: Date | null;
    totalMarks: number;
    totalGain: number;
    createdAt: Date;
    updatedAt: Date;
    subjects: { className: string; mcqTotal: number; mcqGain: number; quesTotal: number; quesGain: number; totalMarks: number; totalGain: number }[];
}) {
    return {
        _id: String(r.id),
        batch: r.batch.name,
        studentId: r.student.studentId,
        studentName: r.studentName,
        resultType: r.resultType,
        examDate: r.examDate ? r.examDate.toISOString() : undefined,
        totalMarks: r.totalMarks,
        totalGain: r.totalGain,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        subjects: r.subjects.map(({ className, mcqTotal, mcqGain, quesTotal, quesGain, totalMarks, totalGain }) => ({
            className, mcqTotal, mcqGain, quesTotal, quesGain, totalMarks, totalGain,
        })),
    };
}

// ---------- GET /api/results ----------
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const batch = (searchParams.get("batch") || "").trim();
    const studentId = (searchParams.get("studentId") || "").trim();
    const resultTypeParam = (searchParams.get("resultType") || "").trim();

    const where: Prisma.ResultWhereInput = {};
    if (q) {
        where.OR = [
            { student: { studentId: { contains: q } } },
            { studentName: { contains: q } },
            { batch: { name: { contains: q } } },
        ];
    }
    if (batch) where.batch = { name: batch };
    if (studentId) where.student = { studentId };
    if (resultTypeParam && (ALLOWED_TYPES as readonly string[]).includes(resultTypeParam)) {
        where.resultType = resultTypeParam;
    }

    const items = await prisma.result.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { batch: true, subjects: true, student: { select: { studentId: true } } },
    });

    return NextResponse.json(items.map(serialize));
}

// ---------- POST /api/results ----------
export async function POST(req: NextRequest) {
    const payloadRaw: unknown = await req.json().catch(() => null);
    const normalized = normalizePayload(payloadRaw);
    if (!normalized) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const student = await findStudentByCode(normalized.studentId);
    if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    const batchId = await resolveBatchId(normalized.batch);

    const totalMarks = normalized.subjects.reduce((acc, s) => acc + (s.totalMarks ?? 0), 0);
    const totalGain = normalized.subjects.reduce((acc, s) => acc + (s.totalGain ?? 0), 0);

    const created = await prisma.result.create({
        data: {
            batchId,
            studentRefId: student.id,
            studentName: normalized.studentName,
            resultType: normalized.resultType,
            examDate: normalized.examDate ? new Date(normalized.examDate) : undefined,
            totalMarks,
            totalGain,
            subjects: {
                create: normalized.subjects.map((s) => ({
                    className: s.className,
                    mcqTotal: s.mcqTotal ?? 0,
                    mcqGain: s.mcqGain ?? 0,
                    quesTotal: s.quesTotal ?? 0,
                    quesGain: s.quesGain ?? 0,
                    totalMarks: s.totalMarks ?? 0,
                    totalGain: s.totalGain ?? 0,
                })),
            },
        },
        include: { batch: true, subjects: true, student: { select: { studentId: true } } },
    });

    return NextResponse.json(serialize(created), { status: 201 });
}
