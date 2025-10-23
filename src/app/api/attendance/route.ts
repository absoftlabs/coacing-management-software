// src/app/api/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter, type UpdateFilter } from "mongodb";

type AttendanceStatus = "Present" | "Absent";

export type AttendanceDoc = {
    _id?: ObjectId;
    date: string;            // YYYY-MM-DD
    studentId: string;
    studentName: string;
    batch: string;
    status: AttendanceStatus;
    createdAt: string;
    updatedAt: string;
};

function ymd(date?: string) {
    // normalize to YYYY-MM-DD
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    return new Date().toISOString().slice(0, 10);
}

// GET /api/attendance?date=YYYY-MM-DD&status=Present|Absent&q=
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const date = ymd(searchParams.get("date") || undefined);
    const status = searchParams.get("status") as AttendanceStatus | null;
    const q = (searchParams.get("q") || "").trim();

    const db = await getDb();
    const col = db.collection<AttendanceDoc>("attendance");

    const filter: Filter<AttendanceDoc> = { date };
    if (status === "Present" || status === "Absent") filter.status = status;
    if (q) {
        const rx = { $regex: q, $options: "i" };
        filter.$or = [{ studentId: rx }, { studentName: rx }, { batch: rx }];
    }

    const items = await col.find(filter).sort({ studentName: 1 }).toArray();
    const rows = items.map(i => ({ ...i, _id: i._id!.toString() }));
    return NextResponse.json(rows);
}

// PUT /api/attendance  body: { date?, studentId, studentName, batch, status: "Present"|"Absent" }
export async function PUT(req: NextRequest) {
    const body = await req.json().catch(() => null) as Partial<AttendanceDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const date = ymd(body.date);
    const studentId = String(body.studentId || "").trim();
    const studentName = String(body.studentName || "").trim();
    const batch = String(body.batch || "").trim();
    const status = body.status === "Present" || body.status === "Absent" ? body.status : null;

    if (!studentId || !studentName || !batch || !status) {
        return NextResponse.json({ error: "studentId, studentName, batch, status required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const db = await getDb();
    const col = db.collection<AttendanceDoc>("attendance");

    // unique key: date + studentId
    const filter: Filter<AttendanceDoc> = { date, studentId };
    const update: UpdateFilter<AttendanceDoc> = {
        $set: { date, studentId, studentName, batch, status, updatedAt: now },
        $setOnInsert: { createdAt: now }
    };

    const res = await col.updateOne(filter, update, { upsert: true });
    return NextResponse.json({ ok: true, upsertedId: res.upsertedId?.toString() });
}

// DELETE /api/attendance  body: { date?, studentId }
// (optional) removes the record, if you prefer “unmark”
export async function DELETE(req: NextRequest) {
    const body = await req.json().catch(() => null) as { date?: string; studentId?: string } | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const date = ymd(body.date);
    const studentId = String(body.studentId || "").trim();
    if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

    const db = await getDb();
    const col = db.collection<AttendanceDoc>("attendance");
    const res = await col.deleteOne({ date, studentId });
    return NextResponse.json({ ok: res.deletedCount > 0 });
}
