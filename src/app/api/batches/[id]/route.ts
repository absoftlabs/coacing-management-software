// src/app/api/batches/[id]/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter, type WithId } from "mongodb";
import type { BatchDoc } from "@/lib/types";

/**
 * ডাটাবেসের জন্য লোকাল টাইপ:
 * আপনার BatchDoc যদি string _id ধরে থাকে, DB-তে আসলে ObjectId ব্যবহৃত হয়।
 * তাই এখানে DB-read/write এর জন্য DB টাইপ বানালাম,
 * আর রেসপন্সে string _id রিটার্ন করলাম।
 */
type BatchDocDb = Omit<BatchDoc, "_id"> & { _id: ObjectId };

function oid(id: string): ObjectId {
    if (!ObjectId.isValid(id)) throw new Error("Invalid id");
    return new ObjectId(id);
}

/** GET /api/batches/:id */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const db = await getDb();
    const col = db.collection<BatchDocDb>("batches");

    const filter: Filter<BatchDocDb> = { _id: oid(params.id) };
    const item = await col.findOne(filter);

    if (!item) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // _id => string
    const res: BatchDoc = { ...item, _id: item._id.toString() } as unknown as BatchDoc;
    return NextResponse.json(res);
}

/** PATCH /api/batches/:id   body: { name } */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const body = (await req.json().catch(() => null)) as Partial<BatchDoc> | null;
    const name = body?.name?.trim();
    if (!name) {
        return NextResponse.json({ error: "Batch name is required" }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection<BatchDocDb>("batches");

    // ডুপ্লিকেট নাম চেক (own id বাদে)
    const dupFilter: Filter<BatchDocDb> = { name, _id: { $ne: oid(params.id) } };
    const dup = await col.findOne(dupFilter);
    if (dup) {
        return NextResponse.json({ error: "Batch name already exists" }, { status: 409 });
    }

    const updateRes = await col.updateOne(
        { _id: oid(params.id) },
        { $set: { name, updatedAt: new Date().toISOString() } }
    );

    if (!updateRes.matchedCount) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await col.findOne({ _id: oid(params.id) });
    if (!updated) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const res: BatchDoc = { ...updated, _id: updated._id.toString() } as unknown as BatchDoc;
    return NextResponse.json(res);
}

/** DELETE /api/batches/:id */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const db = await getDb();
    const col = db.collection<BatchDocDb>("batches");

    const delRes = await col.deleteOne({ _id: oid(params.id) });
    if (!delRes.deletedCount) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
}
