import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter, type UpdateFilter } from "mongodb";
import type { BatchDoc } from "@/lib/types";

type BatchDocDb = Omit<BatchDoc, "_id"> & { _id: ObjectId };

function oid(id: string) {
    if (!ObjectId.isValid(id)) throw new Error("Invalid id");
    return new ObjectId(id);
}

// GET /api/batches/:id
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const db = await getDb();
    const col = db.collection<BatchDocDb>("batches");

    const item = await col.findOne({ _id: oid(id) } as Filter<BatchDocDb>);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ...item, _id: item._id.toString() });
}

// PATCH /api/batches/:id  body: { name }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as Partial<BatchDoc> | null;
    const name = body?.name?.trim();
    if (!name) return NextResponse.json({ error: "Batch name is required" }, { status: 400 });

    const db = await getDb();
    const col = db.collection<BatchDocDb>("batches");

    // unique by name excluding self
    const dup = await col.findOne({ name, _id: { $ne: oid(id) } } as Filter<BatchDocDb>);
    if (dup) return NextResponse.json({ error: "Batch name already exists" }, { status: 409 });

    const update: UpdateFilter<BatchDocDb> = { $set: { name, updatedAt: new Date().toISOString() } };
    const res = await col.updateOne({ _id: oid(id) } as Filter<BatchDocDb>, update);

    if (!res.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const item = await col.findOne({ _id: oid(id) } as Filter<BatchDocDb>);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ...item, _id: item._id.toString() });
}

// DELETE /api/batches/:id
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const db = await getDb();
    const col = db.collection<BatchDocDb>("batches");

    const res = await col.deleteOne({ _id: oid(id) } as Filter<BatchDocDb>);
    if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
}
