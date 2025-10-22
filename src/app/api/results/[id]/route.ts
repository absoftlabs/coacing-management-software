// src/app/api/results/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter, type UpdateFilter } from "mongodb";
import type { ResultDoc, SubjectMark, ResultType } from "@/lib/types";

type ResultDocDb = Omit<ResultDoc, "_id"> & { _id: ObjectId };

function oid(id: string) {
    if (!ObjectId.isValid(id)) throw new Error("Invalid id");
    return new ObjectId(id);
}

function toNum(v: unknown): number | undefined {
    if (v === null || v === undefined || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

function normalizeSubject(input: unknown): SubjectMark | null {
    if (typeof input !== "object" || input === null) return null;
    const o = input as Record<string, unknown>;

    const className =
        typeof o.className === "string" ? o.className.trim() : "";
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

// GET /api/results/:id
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const db = await getDb();
    const col = db.collection<ResultDocDb>("results");
    const item = await col.findOne({ _id: oid(id) } as Filter<ResultDocDb>);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...item, _id: item._id.toString() });
}

// PATCH /api/results/:id
// Updatable fields: batch, studentId, studentName, resultType, examDate, subjects[]
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as Partial<ResultDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    type Updatable = Pick<
        ResultDocDb,
        "batch" | "studentId" | "studentName" | "resultType" | "examDate" | "subjects" | "totalMarks" | "totalGain" | "updatedAt"
    >;

    const set: Partial<Updatable> = { updatedAt: new Date().toISOString() };

    if (typeof body.batch === "string") set.batch = body.batch.trim();
    if (typeof body.studentId === "string") set.studentId = body.studentId.trim();
    if (typeof body.studentName === "string") set.studentName = body.studentName.trim();
    if (typeof body.resultType === "string") set.resultType = body.resultType as ResultType;
    if (typeof body.examDate === "string") set.examDate = body.examDate;

    // subjects full-array replace (optional)
    if (Array.isArray(body.subjects)) {
        const normalized: SubjectMark[] = [];
        for (const s of body.subjects) {
            const ns = normalizeSubject(s);
            if (!ns) {
                return NextResponse.json({ error: "Invalid subject entry" }, { status: 400 });
            }
            normalized.push(ns);
        }
        set.subjects = normalized;
        const { totalMarks, totalGain } = computeTotals(normalized);
        set.totalMarks = totalMarks;
        set.totalGain = totalGain;
    }

    const db = await getDb();
    const col = db.collection<ResultDocDb>("results");

    const filter: Filter<ResultDocDb> = { _id: oid(id) };
    const update: UpdateFilter<ResultDocDb> = { $set: set };
    const res = await col.updateOne(filter, update);
    if (!res.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await col.findOne(filter);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ...updated, _id: updated._id.toString() });
}

// DELETE /api/results/:id
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const db = await getDb();
    const col = db.collection<ResultDocDb>("results");
    const res = await col.deleteOne({ _id: oid(id) } as Filter<ResultDocDb>);
    if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}
