import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { BatchDoc } from "@/lib/types";

// GET /api/batches  -> [{ _id, name, totalClass, totalStudent }]
export async function GET() {
    const db = await getDb();
    const batches = await db.collection<BatchDoc>("batches")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

    // classes count by batch
    const classCountsAgg = await db.collection("classes").aggregate([
        { $match: { batch: { $type: "string" } } },
        { $group: { _id: "$batch", count: { $sum: 1 } } }
    ]).toArray();
    const classMap = new Map<string, number>(
        classCountsAgg.map((x: any) => [String(x._id), x.count])
    );

    // students count by batch
    const studentCountsAgg = await db.collection("students").aggregate([
        { $match: { batch: { $type: "string" } } },
        { $group: { _id: "$batch", count: { $sum: 1 } } }
    ]).toArray();
    const studentMap = new Map<string, number>(
        studentCountsAgg.map((x: any) => [String(x._id), x.count])
    );

    const rows = batches.map((b: any) => ({
        _id: b._id?.toString(),
        name: b.name,
        totalClass: classMap.get(b.name) ?? 0,
        totalStudent: studentMap.get(b.name) ?? 0,
    }));

    return NextResponse.json(rows);
}

// POST /api/batches  -> { _id, name }
export async function POST(req: Request) {
    const body = await req.json().catch(() => null) as Partial<BatchDoc> | null;
    const name = body?.name?.trim();
    if (!name) {
        return NextResponse.json({ error: "Batch name is required" }, { status: 400 });
    }

    const db = await getDb();
    // unique by name
    const exists = await db.collection<BatchDoc>("batches").findOne({ name });
    if (exists) {
        return NextResponse.json({ error: "Batch name already exists" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const doc: BatchDoc = { name, createdAt: now, updatedAt: now };
    const res = await db.collection<BatchDoc>("batches").insertOne(doc as any);
    return NextResponse.json({ _id: res.insertedId.toString(), name }, { status: 201 });
}
