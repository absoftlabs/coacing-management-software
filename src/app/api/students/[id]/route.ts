// src/app/api/students/[id]/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter, type UpdateFilter } from "mongodb";
import type { StudentDoc } from "@/lib/types";

type StudentDocDb = Omit<StudentDoc, "_id"> & { _id: ObjectId };

function oid(id: string) {
    if (!ObjectId.isValid(id)) throw new Error("Invalid id");
    return new ObjectId(id);
}

// GET /api/students/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const db = await getDb();
    const col = db.collection<StudentDocDb>("students");

    const filter: Filter<StudentDocDb> = { _id: oid(params.id) };
    const item = await col.findOne(filter);

    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const res: StudentDoc = { ...item, _id: item._id.toString() } as unknown as StudentDoc;
    return NextResponse.json(res);
}

// PATCH /api/students/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const body = (await req.json().catch(() => null)) as Partial<StudentDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const db = await getDb();
    const col = db.collection<StudentDocDb>("students");

    // কেবল অনুমোদিত ফিল্ডগুলো আপডেট হবে
    const allowed: (keyof StudentDoc)[] = [
        "name", "batch", "roll", "division", "schoolName", "schoolRoll", "schoolSection",
        "address", "fatherName", "motherName", "guardianName", "guardianPhone", "gender",
        "photoUrl", "isSuspended"
    ];

    const set: Partial<Omit<StudentDocDb, "_id">> = {
        updatedAt: new Date().toISOString(),
    };

    for (const f of allowed) {
        // body-তে ফিল্ডটি সত্যিই আছে কি না সেফভাবে চেক
        if (body && Object.prototype.hasOwnProperty.call(body, f)) {
            const value = body[f];
            if (value !== undefined) {
                // days টাইপের মতো কোনো বিশেষ কেস নেই এখানে; ডাইরেক্টলি সেট করা যাবে
                (set as Record<typeof f, typeof value>)[f] = value as never;
            }
        }
    }

    const filter: Filter<StudentDocDb> = { _id: oid(params.id) };
    const update: UpdateFilter<StudentDocDb> = { $set: set };

    const res = await col.updateOne(filter, update);
    if (!res.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await col.findOne(filter);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const apiItem: StudentDoc = { ...updated, _id: updated._id.toString() } as unknown as StudentDoc;
    return NextResponse.json(apiItem);
}

// DELETE /api/students/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const db = await getDb();
    const col = db.collection<StudentDocDb>("students");

    const filter: Filter<StudentDocDb> = { _id: oid(params.id) };
    const res = await col.deleteOne(filter);

    if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}
