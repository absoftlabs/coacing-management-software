import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter, type UpdateFilter } from "mongodb";
import type { ClassDoc } from "@/lib/types";

type ClassDocDb = Omit<ClassDoc, "_id"> & { _id: ObjectId };

function oid(id: string) {
    if (!ObjectId.isValid(id)) throw new Error("Invalid id");
    return new ObjectId(id);
}

// GET /api/classes/:id
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const db = await getDb();
    const col = db.collection<ClassDocDb>("classes");

    const item = await col.findOne({ _id: oid(id) } as Filter<ClassDocDb>);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ...item, _id: item._id.toString() });
}

// PATCH /api/classes/:id
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const db = await getDb();
    const col = db.collection<ClassDocDb>("classes");

    const body = (await req.json().catch(() => null)) as Partial<ClassDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const allowed: (keyof ClassDoc)[] = ["name", "code", "teacher", "batch", "days", "isActive"];
    const set: Partial<Omit<ClassDocDb, "_id">> = { updatedAt: new Date().toISOString() };

    for (const f of allowed) {
        if (body && Object.prototype.hasOwnProperty.call(body, f)) {
            if (f === "days") {
                const arr = body.days;
                if (Array.isArray(arr)) {
                    (set as Pick<ClassDocDb, "days">).days = arr.map(String);
                }
            } else {
                const value = body[f];
                if (value !== undefined) {
                    (set as Record<typeof f, typeof value>)[f] = value as never;
                }
            }
        }
    }

    const filter: Filter<ClassDocDb> = { _id: oid(id) };
    const update: UpdateFilter<ClassDocDb> = { $set: set };
    const res = await col.updateOne(filter, update);

    if (!res.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await col.findOne(filter);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ...updated, _id: updated._id.toString() });
}

// DELETE /api/classes/:id
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const db = await getDb();
    const col = db.collection<ClassDocDb>("classes");

    const res = await col.deleteOne({ _id: oid(id) } as Filter<ClassDocDb>);
    if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
}
