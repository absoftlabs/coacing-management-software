import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter, type UpdateFilter } from "mongodb";
import type { StudentDoc } from "@/lib/types";

type StudentDocDb = Omit<StudentDoc, "_id"> & { _id: ObjectId };

function oid(id: string) {
    if (!ObjectId.isValid(id)) throw new Error("Invalid id");
    return new ObjectId(id);
}

// GET /api/students/:id
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const db = await getDb();
    const col = db.collection<StudentDocDb>("students");

    const item = await col.findOne({ _id: oid(id) } as Filter<StudentDocDb>);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ...item, _id: item._id.toString() });
}

// PATCH /api/students/:id
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as Partial<StudentDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const db = await getDb();
    const col = db.collection<StudentDocDb>("students");

    const allowed: (keyof StudentDoc)[] = [
        "name", "batch", "roll", "division", "schoolName", "schoolRoll", "schoolSection",
        "address", "fatherName", "motherName", "guardianName", "guardianPhone", "gender",
        "photoUrl", "isSuspended"
    ];

    const set: Partial<Omit<StudentDocDb, "_id">> = {
        updatedAt: new Date().toISOString(),
    };

    for (const f of allowed) {
        if (body && Object.prototype.hasOwnProperty.call(body, f)) {
            const value = body[f];
            if (value !== undefined) {
                (set as Record<typeof f, typeof value>)[f] = value as never;
            }
        }
    }

    const filter: Filter<StudentDocDb> = { _id: oid(id) };
    const update: UpdateFilter<StudentDocDb> = { $set: set };

    const res = await col.updateOne(filter, update);
    if (!res.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await col.findOne(filter);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ...updated, _id: updated._id.toString() });
}

// DELETE /api/students/:id
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const db = await getDb();
    const col = db.collection<StudentDocDb>("students");

    const res = await col.deleteOne({ _id: oid(id) } as Filter<StudentDocDb>);
    if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
}
