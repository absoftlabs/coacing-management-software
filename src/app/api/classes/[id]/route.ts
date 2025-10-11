import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { ClassDoc } from "@/lib/types";

function oid(id: string) {
    if (!ObjectId.isValid(id)) throw new Error("Invalid id");
    return new ObjectId(id);
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const db = await getDb();
    const col = db.collection<ClassDoc>("classes");
    const item = await col.findOne({ _id: oid(params.id) } as any);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...item, _id: item._id?.toString() });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const body = (await req.json()) as Partial<ClassDoc>;
    const db = await getDb();
    const col = db.collection<ClassDoc>("classes");

    const set: any = { updatedAt: new Date().toISOString() };
    (["name", "code", "teacher", "batch", "days", "isActive"] as (keyof ClassDoc)[]).forEach(f => {
        if (f in body) (set as any)[f] = (body as any)[f];
    });

    const res = await col.updateOne({ _id: oid(params.id) } as any, { $set: set });
    if (!res.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const item = await col.findOne({ _id: oid(params.id) } as any);
    return NextResponse.json({ ...item, _id: item?._id?.toString() });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const db = await getDb();
    const col = db.collection<ClassDoc>("classes");
    const res = await col.deleteOne({ _id: oid(params.id) } as any);
    if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}
