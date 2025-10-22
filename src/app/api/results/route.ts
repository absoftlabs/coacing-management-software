// src/app/api/results/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
    ObjectId,
    type Filter,
    type OptionalUnlessRequiredId,
} from "mongodb";
import type { ResultDoc, SubjectMark, ResultType } from "@/lib/types";

type ResultDocDb = Omit<ResultDoc, "_id"> & { _id?: ObjectId };

const ALLOWED_TYPES: readonly ResultType[] = [
    "Class Test",
    "Weekly Test",
    "Quiz Test",
    "Model Test",
    "Custom",
];

// ---------- helpers ----------
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

function normalizePayload(
    json: unknown
):
    | (Omit<
        ResultDoc,
        "_id" | "createdAt" | "updatedAt" | "totalMarks" | "totalGain"
    > & { subjects: SubjectMark[] })
    | null {
    if (typeof json !== "object" || json === null) return null;
    const o = json as Record<string, unknown>;

    const batch = typeof o.batch === "string" ? o.batch.trim() : "";
    const studentId = typeof o.studentId === "string" ? o.studentId.trim() : "";
    const studentName =
        typeof o.studentName === "string" ? o.studentName.trim() : "";
    const resultType =
        typeof o.resultType === "string" &&
            (ALLOWED_TYPES as readonly string[]).includes(o.resultType)
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

// ---------- GET /api/results ----------
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const batch = (searchParams.get("batch") || "").trim();
    const studentId = (searchParams.get("studentId") || "").trim();
    const resultTypeParam = (searchParams.get("resultType") || "").trim();

    const db = await getDb();
    const col = db.collection<ResultDocDb>("results");

    const filter: Filter<ResultDocDb> = {};
    if (q) {
        const rx = { $regex: q, $options: "i" };
        filter.$or = [{ studentId: rx }, { studentName: rx }, { batch: rx }];
    }
    if (batch) filter.batch = batch;
    if (studentId) filter.studentId = studentId;
    if (
        resultTypeParam &&
        (ALLOWED_TYPES as readonly string[]).includes(resultTypeParam)
    ) {
        filter.resultType = resultTypeParam as ResultType;
    }

    const items = await col.find(filter).sort({ createdAt: -1 }).toArray();

    // Map DB shape (_id: ObjectId) -> client shape (_id: string)
    const rows: ResultDoc[] = items.map((i) => ({
        ...i,
        _id: i._id!.toString(),
    }));

    return NextResponse.json(rows);
}

// ---------- POST /api/results ----------
export async function POST(req: NextRequest) {
    const payloadRaw: unknown = await req.json().catch(() => null);
    const normalized = normalizePayload(payloadRaw);
    if (!normalized) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Compute overall totals from subjects
    const totalMarks = normalized.subjects.reduce(
        (acc: number, s: SubjectMark) => acc + (s.totalMarks ?? 0),
        0
    );
    const totalGain = normalized.subjects.reduce(
        (acc: number, s: SubjectMark) => acc + (s.totalGain ?? 0),
        0
    );

    const now = new Date().toISOString();

    // Do not include _id; let MongoDB generate it
    const insertDoc: OptionalUnlessRequiredId<ResultDocDb> = {
        batch: normalized.batch,
        studentId: normalized.studentId,
        studentName: normalized.studentName,
        resultType: normalized.resultType,
        examDate: normalized.examDate,
        subjects: normalized.subjects,
        totalMarks,
        totalGain,
        createdAt: now,
        updatedAt: now,
    };

    const db = await getDb();
    const col = db.collection<ResultDocDb>("results");
    const res = await col.insertOne(insertDoc);

    // Return client shape with string _id
    const created: ResultDoc = {
        _id: res.insertedId.toString(),
        batch: insertDoc.batch,
        studentId: insertDoc.studentId,
        studentName: insertDoc.studentName,
        resultType: insertDoc.resultType,
        examDate: insertDoc.examDate,
        subjects: insertDoc.subjects,
        totalMarks: insertDoc.totalMarks!,
        totalGain: insertDoc.totalGain!,
        createdAt: insertDoc.createdAt!,
        updatedAt: insertDoc.updatedAt!,
    };

    return NextResponse.json(created, { status: 201 });
}