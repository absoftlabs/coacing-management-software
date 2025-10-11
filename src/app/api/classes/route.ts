import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ClassDoc } from "@/lib/types";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").toLowerCase();

    const db = await getDb();
    const col = db.collection<ClassDoc>("classes");

    const filter = q
        ? {
            $or: [
                { name: { $regex: q, $options: "i" } },
                { code: { $regex: q, $options: "i" } },
                { teacher: { $regex: q, $options: "i" } },
                { batch: { $regex: q, $options: "i" } },  // <- batch search
            ],
        }
        : {};

    const items = await col.find(filter).toArray();

    const rows = items.map((x) => ({
        ...x,
        _id: typeof x._id === "string"
            ? x._id
            : (x._id && typeof x._id === "object" && "toString" in x._id)
                ? (x._id as ObjectId).toString()
                : "",
    }));

    return NextResponse.json(rows);
}

export async function POST(req: Request) {
    const body = (await req.json()) as Partial<ClassDoc>;
    if (!body.name || !body.code) {
        return NextResponse.json({ error: "name & code are required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const doc: ClassDoc = {
        name: body.name.trim(),
        code: body.code.trim(),
        teacher: body.teacher?.trim() || "",
        batch: body.batch?.trim() || "",      // <- batch set
        days: Array.isArray(body.days) ? body.days : [],
        isActive: body.isActive ?? true,
        createdAt: now,
        updatedAt: now,
    };

    const db = await getDb();
    const col = db.collection<ClassDoc>("classes");
    const res = await col.insertOne(doc);
    return NextResponse.json({ _id: res.insertedId.toString(), ...doc }, { status: 201 });
}
