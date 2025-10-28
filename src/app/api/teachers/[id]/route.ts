// src/app/api/teachers/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter, type UpdateFilter } from "mongodb";
import type { TeacherDoc } from "@/lib/types";

type TeacherDocDb = Omit<TeacherDoc, "_id"> & { _id: ObjectId };

function oid(id: string) {
    if (!ObjectId.isValid(id)) throw new Error("Invalid id");
    return new ObjectId(id);
}

function toNum(v: unknown): number | undefined {
    if (v === null || v === undefined || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

// GET
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const db = await getDb();
    const col = db.collection<TeacherDocDb>("teachers");
    const item = await col.findOne({ _id: oid(id) } as Filter<TeacherDocDb>);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...item, _id: item._id.toString() });
}

// PATCH
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as Partial<TeacherDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    type Updatable = Pick<
        TeacherDocDb,
        "name" | "phone" | "imageUrl" | "primarySubject" | "joinDate" | "salary" | "isSuspended" | "updatedAt"
    >;

    const set: Partial<Updatable> = { updatedAt: new Date().toISOString() };

    if (typeof body.name === "string") set.name = body.name.trim();
    if (typeof body.phone === "string") set.phone = body.phone.trim();
    if (typeof body.imageUrl === "string") set.imageUrl = body.imageUrl.trim();
    if (typeof body.primarySubject === "string") set.primarySubject = body.primarySubject.trim();
    if (typeof body.joinDate === "string") set.joinDate = body.joinDate;
    const sal = toNum(body.salary);
    if (sal !== undefined) set.salary = sal;
    if (typeof body.isSuspended === "boolean") set.isSuspended = body.isSuspended;

    const db2 = await getDb();
    const col2 = db2.collection<TeacherDocDb>("teachers");
    const filter: Filter<TeacherDocDb> = { _id: oid(id) };
    const update: UpdateFilter<TeacherDocDb> = { $set: set };
    const res = await col2.updateOne(filter, update);

    if (!res.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await col2.findOne(filter);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...updated, _id: updated._id.toString() });
}

// DELETE
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const db = await getDb();
    const col = db.collection<TeacherDocDb>("teachers");
    const res = await col.deleteOne({ _id: oid(id) } as Filter<TeacherDocDb>);
    if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}
