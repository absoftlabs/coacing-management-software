import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter, type OptionalUnlessRequiredId } from "mongodb";
import type { FeeDoc } from "@/lib/types";

type FeeDocDb = Omit<FeeDoc, "_id"> & { _id?: ObjectId }; // ✅ optional _id

// ✅ GET /api/fees
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    const db = await getDb();
    const col = db.collection<FeeDocDb>("fees");

    const filter: Filter<FeeDocDb> = {};
    if (q) {
        const rx = { $regex: q, $options: "i" };
        filter.$or = [{ studentName: rx }, { studentId: rx }, { depositBy: rx }];
    }

    const items = await col.find(filter).sort({ createdAt: -1 }).toArray();
    const rows: FeeDoc[] = items.map(i => ({ ...i, _id: i._id!.toString() }));

    return NextResponse.json(rows);
}

// ✅ POST /api/fees
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const studentId = String(body.studentId || "").trim();
    const studentName = String(body.studentName || "").trim();
    const depositBy = String(body.depositBy || "").trim();
    const receivedBy = String(body.receivedBy || "").trim();
    const amount = Number(body.amount || 0);

    if (!studentId || !studentName || !depositBy || !receivedBy || !amount) {
        return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // ✅ use OptionalUnlessRequiredId or optional _id
    const doc: OptionalUnlessRequiredId<FeeDocDb> = {
        studentId,
        studentName,
        depositBy,
        receivedBy,
        amount,
        createdAt: now,
        updatedAt: now,
    };

    const db = await getDb();
    const col = db.collection<FeeDocDb>("fees");
    const res = await col.insertOne(doc);

    return NextResponse.json({ _id: res.insertedId.toString(), ...doc }, { status: 201 });
}
