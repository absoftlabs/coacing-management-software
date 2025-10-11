import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { StudentDoc } from "@/lib/types";

function oid(id: string) {
    if (!ObjectId.isValid(id)) throw new Error("Invalid id");
    return new ObjectId(id);
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const db = await getDb();
    const item = await db.collection<StudentDoc>("students").findOne({ _id: oid(params.id) } as any);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...item, _id: item._id?.toString() });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const body = (await req.json().catch(() => null)) as Partial<StudentDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const set: any = { updatedAt: new Date().toISOString() };
    const fields: (keyof StudentDoc)[] = [
        "name", "batch", "roll", "division", "schoolName", "schoolRoll", "schoolSection",
        "address", "fatherName", "motherName", "guardianName", "guardianPhone", "gender",
        "photoUrl", "isSuspended"
    ];
    for (const f of fields) if (f in body) set[f] = (body as any)[f];

    const db = await getDb();
    const res = await db.collection<StudentDoc>("students").updateOne(
        { _id: oid(params.id) } as any,
        { $set: set }
    );
    if (!res.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const item = await db.collection<StudentDoc>("students").findOne({ _id: oid(params.id) } as any);
    return NextResponse.json({ ...item, _id: item?._id?.toString() });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const db = await getDb();
    const res = await db.collection<StudentDoc>("students").deleteOne({ _id: oid(params.id) } as any);
    if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}
