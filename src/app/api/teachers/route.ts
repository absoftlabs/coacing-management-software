// src/app/api/teachers/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter } from "mongodb";
import type { TeacherDoc } from "@/lib/types";

type TeacherDocDb = Omit<TeacherDoc, "_id"> & { _id: ObjectId };

function toNum(v: unknown): number | undefined {
    if (v === null || v === undefined || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

// GET /api/teachers?q=&suspended=true|false
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const suspended = searchParams.get("suspended");

    const db = await getDb();
    const col = db.collection<TeacherDocDb>("teachers");

    const filter: Filter<TeacherDocDb> = {};
    if (q) {
        const rx = { $regex: q, $options: "i" };
        filter.$or = [{ name: rx }, { primarySubject: rx }];
    }
    if (suspended === "true") filter.isSuspended = true;
    else if (suspended === "false") filter.isSuspended = { $ne: true };

    const items = await col.find(filter).sort({ createdAt: -1 }).toArray();

    // totalAssignedClass from "classes" collection where classes.teacher === teacher.name
    const classAgg = await db.collection("classes").aggregate<{ _id: string; count: number }>([
        { $match: { teacher: { $type: "string" } } },
        { $group: { _id: "$teacher", count: { $sum: 1 } } }
    ]).toArray();
    const classMap = new Map<string, number>(classAgg.map(x => [String(x._id), x.count]));

    const rows = items.map(i => ({
        ...i,
        _id: i._id.toString(),
        totalAssignedClass: classMap.get(i.name) ?? 0,     // extra computed field for list UI
    }));

    return NextResponse.json(rows);
}

// POST /api/teachers
export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as Partial<TeacherDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const name = String(body.name || "").trim();
    const primarySubject = String(body.primarySubject || "").trim();
    if (!name || !primarySubject) {
        return NextResponse.json({ error: "name, primarySubject are required" }, { status: 400 });
    }

    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : undefined;
    const joinDate = typeof body.joinDate === "string" ? body.joinDate : undefined;
    const salary = toNum(body.salary);

    const now = new Date().toISOString();
    const doc: Omit<TeacherDocDb, "_id"> = {
        name,
        imageUrl,
        primarySubject,
        joinDate,
        salary,
        isSuspended: !!body.isSuspended,
        createdAt: now,
        updatedAt: now,
    };

    const db = await getDb();
    const res = await db.collection<TeacherDocDb>("teachers").insertOne(doc as TeacherDocDb);
    return NextResponse.json({ _id: res.insertedId.toString(), ...doc }, { status: 201 });
}
