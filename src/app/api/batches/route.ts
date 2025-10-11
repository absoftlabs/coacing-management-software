// src/app/api/batches/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { BatchDoc } from "@/lib/types";

type BatchDocDb = Omit<BatchDoc, "_id"> & { _id: ObjectId };
type CountAgg = { _id: string; count: number };

// GET /api/batches -> [{ _id, name, totalClass, totalStudent }]
export async function GET() {
    const db = await getDb();

    const batches = await db
        .collection<BatchDocDb>("batches")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

    const classCountsAgg = await db
        .collection("classes")
        .aggregate<CountAgg>([
            { $match: { batch: { $type: "string" } } },
            { $group: { _id: "$batch", count: { $sum: 1 } } },
        ])
        .toArray();
    const classMap = new Map(classCountsAgg.map((x) => [x._id, x.count]));

    const studentCountsAgg = await db
        .collection("students")
        .aggregate<CountAgg>([
            {
                $match: {
                    batch: { $type: "string" },
                    $or: [{ isSuspended: { $exists: false } }, { isSuspended: { $ne: true } }],
                },
            },
            { $group: { _id: "$batch", count: { $sum: 1 } } },
        ])
        .toArray();
    const studentMap = new Map(studentCountsAgg.map((x) => [x._id, x.count]));

    const rows = batches.map((b) => ({
        _id: b._id.toString(),
        name: b.name,
        totalClass: classMap.get(b.name) ?? 0,
        totalStudent: studentMap.get(b.name) ?? 0,
    }));

    return NextResponse.json(rows);
}

// POST /api/batches -> { _id, name }
export async function POST(req: Request) {
    const body = (await req.json().catch(() => null)) as Partial<BatchDoc> | null;
    const name = body?.name?.trim();
    if (!name) {
        return NextResponse.json({ error: "Batch name is required" }, { status: 400 });
    }

    const db = await getDb();

    // ✅ READ collection: _id required (ObjectId)
    const colRead = db.collection<BatchDocDb>("batches");

    // unique name check
    const exists = await colRead.findOne({ name });
    if (exists) {
        return NextResponse.json({ error: "Batch name already exists" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const docWithoutId: Omit<BatchDocDb, "_id"> = {
        name,
        createdAt: now,
        updatedAt: now,
    };

    // ✅ WRITE collection: _id omitted for insert
    const colWrite = db.collection<Omit<BatchDocDb, "_id">>("batches");
    const res = await colWrite.insertOne(docWithoutId);

    return NextResponse.json({ _id: res.insertedId.toString(), name }, { status: 201 });
}
