// src/app/api/results/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { ResultDoc } from "@/lib/types";
import { ObjectId, type Filter, type OptionalId } from "mongodb";

type ResultDocDb = Omit<ResultDoc, "_id"> & { _id: ObjectId };

// GET /api/results?q=&batch=&class=&name=&studentId=
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const batch = (searchParams.get("batch") || "").trim();
    const className = (searchParams.get("class") || "").trim();
    const name = (searchParams.get("name") || "").trim();
    const studentId = (searchParams.get("studentId") || "").trim();

    const db = await getDb();
    const col = db.collection<ResultDocDb>("results");

    const filter: Filter<ResultDocDb> = {};
    if (q) {
        const rx = { $regex: q, $options: "i" } as const;
        filter.$or = [
            { studentId: rx },
            { studentName: rx },
            { batch: rx },
            { className: rx },
            { resultType: rx },
        ];
    }
    if (batch) filter.batch = batch;
    if (className) filter.className = className;
    if (name) filter.studentName = { $regex: name, $options: "i" };
    if (studentId) filter.studentId = studentId;

    const items = await col.find(filter).sort({ createdAt: -1 }).toArray();

    const rows: ResultDoc[] = items.map(({ _id, ...rest }) => ({
        ...rest,
        _id: _id.toString(),
    }));

    return NextResponse.json(rows);
}

// POST /api/results
export async function POST(req: Request) {
    const body = (await req.json().catch(() => null)) as Partial<ResultDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const batch = String(body.batch ?? "").trim();
    const studentId = String(body.studentId ?? "").trim();
    const studentName = String(body.studentName ?? "").trim();
    const className = String(body.className ?? "").trim();
    const resultType = String(body.resultType ?? "").trim();
    const examDate = body.examDate ? String(body.examDate) : undefined;

    if (!batch || !studentId || !studentName || !className || !resultType) {
        return NextResponse.json({ error: "batch, studentId, studentName, className, resultType are required" }, { status: 400 });
    }

    const toNum = (v: unknown): number | undefined => {
        if (v === null || v === undefined) return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
    };

    const mcqTotal = toNum(body.mcqTotal) ?? 0;
    const mcqGain = toNum(body.mcqGain) ?? 0;
    const quesTotal = toNum(body.quesTotal) ?? 0;
    const quesGain = toNum(body.quesGain) ?? 0;

    const totalMarks = mcqTotal + quesTotal;
    const totalGain = mcqGain + quesGain;

    const now = new Date().toISOString();

    const db = await getDb();
    const col = db.collection<OptionalId<ResultDocDb>>("results");

    const insertDoc: OptionalId<ResultDocDb> = {
        batch,
        studentId,
        studentName,
        className,
        resultType,
        examDate,

        mcqTotal,
        mcqGain,
        quesTotal,
        quesGain,
        totalMarks,
        totalGain,

        createdAt: now,
        updatedAt: now,
    };

    const res = await col.insertOne(insertDoc);

    const response: ResultDoc = {
        ...insertDoc,
        _id: res.insertedId.toString(),
    };

    return NextResponse.json(response, { status: 201 });
}
