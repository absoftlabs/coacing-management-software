// src/app/api/teachers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter } from "mongodb";

type TeacherDocDb = {
    _id?: ObjectId;
    teacherId?: string;
    name: string;
    phone?: string;
    mobile?: string;
    phoneNumber?: string;
    subject?: string;
    status?: "active" | "suspended";
    createdAt?: string;
    updatedAt?: string;
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const onlyActive = searchParams.get("onlyActive") === "1";

    const db = await getDb();
    const col = db.collection<TeacherDocDb>("teachers");

    const filter: Filter<TeacherDocDb> = {};
    if (onlyActive) {
        filter.status = { $ne: "suspended" } as any;
    }
    if (q) {
        const rx = { $regex: q, $options: "i" };
        (filter as any).$or = [{ name: rx }, { teacherId: rx }, { subject: rx }];
    }

    const items = await col.find(filter).sort({ createdAt: -1 }).toArray();
    const rows = items.map((t) => ({
        _id: t._id ? t._id.toHexString() : undefined,
        teacherId: t.teacherId ?? "",
        name: t.name,
        phone: t.phone ?? t.mobile ?? t.phoneNumber ?? "",
        subject: t.subject ?? "",
        status: t.status ?? "active",
    }));

    return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as {
        name: string;
        phone?: string;
        subject?: string;
        teacherId?: string;
    } | null;

    if (!body?.name) {
        return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const doc: Omit<TeacherDocDb, "_id"> = {
        teacherId: body.teacherId,
        name: body.name,
        phone: body.phone,
        subject: body.subject,
        status: "active",
        createdAt: now,
        updatedAt: now,
    };

    const db = await getDb();
    const res = await db.collection<TeacherDocDb>("teachers").insertOne(doc as any);

    return NextResponse.json(
        { _id: res.insertedId.toHexString(), ...doc },
        { status: 201 }
    );
}
