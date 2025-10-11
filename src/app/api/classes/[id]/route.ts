// src/app/api/classes/[id]/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter, type UpdateFilter } from "mongodb";
import type { ClassDoc } from "@/lib/types";

type ClassDocDb = Omit<ClassDoc, "_id"> & { _id: ObjectId };

function oid(id: string) {
    if (!ObjectId.isValid(id)) throw new Error("Invalid id");
    return new ObjectId(id);
}

// GET /api/classes/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const db = await getDb();
    const col = db.collection<ClassDocDb>("classes");

    const filter: Filter<ClassDocDb> = { _id: oid(params.id) };
    const item = await col.findOne(filter);

    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const res: ClassDoc = { ...item, _id: item._id.toString() } as unknown as ClassDoc;
    return NextResponse.json(res);
}

// PATCH /api/classes/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const db = await getDb();
    const col = db.collection<ClassDocDb>("classes");

    const body = (await req.json().catch(() => null)) as Partial<ClassDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    // কেবল অনুমোদিত ফিল্ডগুলো সিলেক্ট করুন
    const allowed: (keyof ClassDoc)[] = ["name", "code", "teacher", "batch", "days", "isActive"];
    const set: Partial<Omit<ClassDocDb, "_id">> = { updatedAt: new Date().toISOString() };

    for (const f of allowed) {
        if (body && Object.prototype.hasOwnProperty.call(body, f)) {
            if (f === "days") {
                const arr = body.days;
                if (Array.isArray(arr)) {
                    (set as Pick<ClassDoc, "days">).days = arr.map(String);
                }
                continue;
            }

            // সেফভাবে টাইপ কাস্ট (ClassDoc এর কী অনুযায়ী)
            const value = body[f];
            if (value !== undefined) {
                (set as Record<typeof f, typeof value>)[f] = value;
            }
        }
    }


    const filter: Filter<ClassDocDb> = { _id: oid(params.id) };
    const update: UpdateFilter<ClassDocDb> = { $set: set };

    const res = await col.updateOne(filter, update);
    if (!res.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await col.findOne(filter);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const apiItem: ClassDoc = { ...updated, _id: updated._id.toString() } as unknown as ClassDoc;
    return NextResponse.json(apiItem);
}

// DELETE /api/classes/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const db = await getDb();
    const col = db.collection<ClassDocDb>("classes");

    const filter: Filter<ClassDocDb> = { _id: oid(params.id) };
    const res = await col.deleteOne(filter);

    if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}
