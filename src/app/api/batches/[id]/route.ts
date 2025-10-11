import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { BatchDoc } from "@/lib/types";

function oid(id: string) {
    if (!ObjectId.isValid(id)) throw new Error("Invalid id");
    return new ObjectId(id);
}

// GET /api/batches/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const db = await getDb();
    const item = await db.collection<BatchDoc>("batches").findOne({ _id: oid(params.id) } as any);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...item, _id: item._id?.toString() });
}

// PATCH /api/batches/:id  body: { name }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const body = await req.json().catch(() => null) as Partial<BatchDoc> | null;
    const name = body?.name?.trim();
    if (!name) return NextResponse.json({ error: "Batch name is required" }, { status: 400 });

    const db = await getDb();
    // name unique conflict?
    const dup = await db.collection<BatchDoc>("batches").findOne({ name, _id: { $ne: oid(params.id) } } as any);
    if (dup) return NextResponse.json({ error: "Batch name already exists" }, { status: 409 });

    const res = await db.collection<BatchDoc>("batches").updateOne(
        { _id: oid(params.id) } as any,
        { $set: { name, updatedAt: new Date().toISOString() } }
    );

    if (!res.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const item = await db.collection<BatchDoc>("batches").findOne({ _id: oid(params.id) } as any);
    return NextResponse.json({ ...item, _id: item?._id?.toString() });
}

// DELETE /api/batches/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const db = await getDb();
    const res = await db.collection<BatchDoc>("batches").deleteOne({ _id: oid(params.id) } as any);
    if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}
