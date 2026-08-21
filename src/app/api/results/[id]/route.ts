// src/app/api/results/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ResultDoc, SubjectMark, ResultType } from "@/lib/types";
import type { Prisma } from "@prisma/client";
import { resolveBatchId, findStudentByCode, prismaDeleteErrorResponse } from "@/lib/dbHelpers";

function toId(id: string): number {
    const n = Number(id);
    if (!Number.isInteger(n)) throw new Error("Invalid id");
    return n;
}

function toNum(v: unknown): number | undefined {
    if (v === null || v === undefined || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

function normalizeSubject(input: unknown): SubjectMark | null {
    if (typeof input !== "object" || input === null) return null;
    const o = input as Record<string, unknown>;

    const className = typeof o.className === "string" ? o.className.trim() : "";
    if (!className) return null;

    const mcqTotal = toNum(o.mcqTotal) ?? 0;
    const mcqGain = toNum(o.mcqGain) ?? 0;
    const quesTotal = toNum(o.quesTotal) ?? 0;
    const quesGain = toNum(o.quesGain) ?? 0;

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

function computeTotals(subjects: SubjectMark[]): { totalMarks: number; totalGain: number } {
    const totalMarks = subjects.reduce((acc, s) => acc + (s.totalMarks ?? 0), 0);
    const totalGain = subjects.reduce((acc, s) => acc + (s.totalGain ?? 0), 0);
    return { totalMarks, totalGain };
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

// GET /api/results/:id
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let resultId: number;
    try {
        resultId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await prisma.result.findUnique({
        where: { id: resultId },
        include: { batch: true, subjects: true, student: { select: { studentId: true } } },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(serialize(item));
}

// PATCH /api/results/:id
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let resultId: number;
    try {
        resultId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => null)) as Partial<ResultDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const data: Prisma.ResultUpdateInput = {};

    if (typeof body.batch === "string" && body.batch.trim()) {
        data.batch = { connect: { id: await resolveBatchId(body.batch.trim()) } };
    }
    if (typeof body.studentId === "string" && body.studentId.trim()) {
        const student = await findStudentByCode(body.studentId.trim());
        if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
        data.student = { connect: { id: student.id } };
    }
    if (typeof body.studentName === "string") data.studentName = body.studentName.trim();
    if (typeof body.resultType === "string") data.resultType = body.resultType as ResultType;
    if (typeof body.examDate === "string") data.examDate = new Date(body.examDate);

    if (Array.isArray(body.subjects)) {
        const normalized: SubjectMark[] = [];
        for (const s of body.subjects) {
            const ns = normalizeSubject(s);
            if (!ns) {
                return NextResponse.json({ error: "Invalid subject entry" }, { status: 400 });
            }
            normalized.push(ns);
        }
        const { totalMarks, totalGain } = computeTotals(normalized);
        data.totalMarks = totalMarks;
        data.totalGain = totalGain;
        data.subjects = {
            deleteMany: {},
            create: normalized.map((s) => ({
                className: s.className,
                mcqTotal: s.mcqTotal ?? 0,
                mcqGain: s.mcqGain ?? 0,
                quesTotal: s.quesTotal ?? 0,
                quesGain: s.quesGain ?? 0,
                totalMarks: s.totalMarks ?? 0,
                totalGain: s.totalGain ?? 0,
            })),
        };
    }

    try {
        const updated = await prisma.result.update({
            where: { id: resultId },
            data,
            include: { batch: true, subjects: true, student: { select: { studentId: true } } },
        });
        return NextResponse.json(serialize(updated));
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}

// DELETE /api/results/:id
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let resultId: number;
    try {
        resultId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        await prisma.result.delete({ where: { id: resultId } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return prismaDeleteErrorResponse(error);
    }
}
