// src/app/api/results/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter, type UpdateFilter } from "mongodb";
import type { ResultDoc } from "@/lib/types";

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
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as Partial<ResultDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    // আপডেটেবল ফিল্ডগুলোকে টাইপ-সেফভাবে ধরতে আলাদা টাইপ
    type Updatable = Pick<
        ResultDocDb,
        | "batch"
        | "studentId"
        | "studentName"
        | "className"
        | "resultType"
        | "examDate"
        | "mcqTotal"
        | "mcqGain"
        | "quesTotal"
        | "quesGain"
        | "totalMarks"
        | "totalGain"
        | "updatedAt"
    >;

    const set: Partial<Updatable> = { updatedAt: new Date().toISOString() };

    // string ফিল্ডগুলো (undefined হলে skip)
    if (typeof body.batch === "string") set.batch = body.batch;
    if (typeof body.studentId === "string") set.studentId = body.studentId;
    if (typeof body.studentName === "string") set.studentName = body.studentName;
    if (typeof body.className === "string") set.className = body.className;
    if (typeof body.resultType === "string") set.resultType = body.resultType;
    if (typeof body.examDate === "string") set.examDate = body.examDate;

    // numeric ফিল্ডগুলো (toNum দিয়ে coercion)
    const mt = toNum(body.mcqTotal);
    const mg = toNum(body.mcqGain);
    const qt = toNum(body.quesTotal);
    const qg = toNum(body.quesGain);

    if (mt !== undefined) set.mcqTotal = mt;
    if (mg !== undefined) set.mcqGain = mg;
    if (qt !== undefined) set.quesTotal = qt;
    if (qg !== undefined) set.quesGain = qg;

    // কোন মার্কস ফিল্ড আপডেট হয়েছে কি না?
    const marksChanged =
        mt !== undefined || mg !== undefined || qt !== undefined || qg !== undefined;

    if (marksChanged) {
        // টোটাল বের করতে সব ভ্যালু দরকার; না থাকলে কারেন্ট ডক থেকে আনব
        const db = await getDb();
        const col = db.collection<ResultDocDb>("results");
        const current = await col.findOne({ _id: oid(id) } as Filter<ResultDocDb>);

        if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const finalMcqTotal = set.mcqTotal ?? current.mcqTotal ?? 0;
        const finalMcqGain = set.mcqGain ?? current.mcqGain ?? 0;
        const finalQuesTotal = set.quesTotal ?? current.quesTotal ?? 0;
        const finalQuesGain = set.quesGain ?? current.quesGain ?? 0;

        set.totalMarks = finalMcqTotal + finalQuesTotal;
        set.totalGain = finalMcqGain + finalQuesGain;
    }

    // আপডেট চালান
    const db2 = await getDb();
    const col2 = db2.collection<ResultDocDb>("results");

    const filter: Filter<ResultDocDb> = { _id: oid(id) };
    const update: UpdateFilter<ResultDocDb> = { $set: set };
    const res = await col2.updateOne(filter, update);
    if (!res.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await col2.findOne(filter);
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
