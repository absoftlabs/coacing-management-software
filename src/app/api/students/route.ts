import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { StudentDoc } from "@/lib/types";

// utility: random 5-digit string with leading zeros
function random5() {
    return String(Math.floor(Math.random() * 100000)).padStart(5, "0");
}

// GET /api/students?q=&batch=&roll=&suspended=true|false
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const batch = (searchParams.get("batch") || "").trim();
    const roll = (searchParams.get("roll") || "").trim();
    const suspended = searchParams.get("suspended");

    const db = await getDb();
    const col = db.collection<StudentDoc>("students");

    const filter: any = {};
    if (q) {
        const rx = { $regex: q, $options: "i" };
        filter.$or = [
            { name: rx }, { studentId: rx }, { batch: rx }, { roll: rx },
            { guardianName: rx }, { guardianPhone: rx }
        ];
    }
    if (batch) filter.batch = batch;
    if (roll) filter.roll = roll;
    if (suspended === "true") filter.isSuspended = true;
    else if (suspended === "false") filter.isSuspended = { $ne: true };

    const items = await col.find(filter).sort({ createdAt: -1 }).toArray();
    const rows = items.map((x: any) => ({ ...x, _id: x._id?.toString() }));
    return NextResponse.json(rows);
}

// POST /api/students  -> studentId "PCC-XXXXX" (random, unique)
export async function POST(req: Request) {
    const body = (await req.json().catch(() => null)) as Partial<StudentDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const name = String(body.name || "").trim();
    const batch = String(body.batch || "").trim();
    const roll = String(body.roll || "").trim();
    if (!name || !batch || !roll) {
        return NextResponse.json({ error: "name, batch, roll are required" }, { status: 400 });
    }

    const db = await getDb();
    // generate unique random ID
    let studentId = "";
    for (let i = 0; i < 10; i++) {
        const candidate = `PCC-${random5()}`;
        const exists = await db.collection<StudentDoc>("students").findOne({ studentId: candidate });
        if (!exists) {
            studentId = candidate;
            break;
        }
    }
    if (!studentId) {
        return NextResponse.json({ error: "Failed to allocate studentId. Try again." }, { status: 500 });
    }

    const now = new Date().toISOString();
    const doc: StudentDoc = {
        studentId,
        name,
        batch,
        roll,
        division: body.division as any,
        schoolName: body.schoolName || "",
        schoolRoll: body.schoolRoll || "",
        schoolSection: body.schoolSection as any,
        address: body.address || "",
        fatherName: body.fatherName || "",
        motherName: body.motherName || "",
        guardianName: body.guardianName || "",
        guardianPhone: body.guardianPhone || "",
        gender: body.gender as any,
        photoUrl: body.photoUrl || "",   // <- accept data URL
        isSuspended: !!body.isSuspended,
        createdAt: now,
        updatedAt: now,
    };

    const res = await db.collection<StudentDoc>("students").insertOne(doc as any);
    return NextResponse.json({ _id: res.insertedId.toString(), ...doc }, { status: 201 });
}
