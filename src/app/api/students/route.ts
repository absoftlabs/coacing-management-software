// src/app/api/students/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter } from "mongodb";
import type { StudentDoc } from "@/lib/types";

// === Utility: random 5-digit string ===
function random5(): string {
    return String(Math.floor(Math.random() * 100000)).padStart(5, "0");
}

// === Local DB type ===
// API টাইপ (StudentDoc) এ _id সাধারণত string থাকে। DB-তে আমরা _id: ObjectId রাখছি,
// আর enum-সদৃশ ফিল্ডগুলো (division, schoolSection, gender) DB-শেপে string হিসেবে শিথিল করলাম
// যাতে টাইপ কনফ্লিক্ট না হয়।
type StudentDocDb = Omit<
    StudentDoc,
    "_id" | "division" | "schoolSection" | "gender"
> & {
    _id: ObjectId;
    division?: string;
    schoolSection?: string;
    gender?: string;
};

// === GET /api/students?q=&batch=&roll=&suspended=true|false ===
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const batch = (searchParams.get("batch") || "").trim();
    const roll = (searchParams.get("roll") || "").trim();
    const suspended = searchParams.get("suspended");

    const db = await getDb();
    const colRead = db.collection<StudentDocDb>("students");

    const filter: Filter<StudentDocDb> = {};
    if (q) {
        const rx = { $regex: q, $options: "i" };
        filter.$or = [
            { name: rx },
            { studentId: rx },
            { batch: rx },
            { roll: rx },
            { guardianName: rx },
            { guardianPhone: rx },
        ];
    }
    if (batch) filter.batch = batch;
    if (roll) filter.roll = roll;
    if (suspended === "true") filter.isSuspended = true;
    else if (suspended === "false") filter.isSuspended = { $ne: true };

    const items = await colRead.find(filter).sort({ createdAt: -1 }).toArray();

    // API রেসপন্সে _id => string
    const rows: StudentDoc[] = items.map((x) => ({
        ...x,
        _id: x._id.toString(),
    })) as unknown as StudentDoc[];

    return NextResponse.json(rows);
}

// === POST /api/students ===
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

    // READ কালেকশন (ObjectId সহ)
    const colRead = db.collection<StudentDocDb>("students");

    // === Generate unique Student ID ===
    let studentId = "";
    for (let i = 0; i < 10; i++) {
        const candidate = `PCC-${random5()}`;
        const exists = await colRead.findOne({ studentId: candidate });
        if (!exists) {
            studentId = candidate;
            break;
        }
    }
    if (!studentId) {
        return NextResponse.json({ error: "Failed to allocate studentId. Try again." }, { status: 500 });
    }

    const now = new Date().toISOString();

    // WRITE কালেকশন (insert এর জন্য _id বাদ)
    const colWrite = db.collection<Omit<StudentDocDb, "_id">>("students");

    // DB-শেপে ডকুমেন্ট তৈরি — division/section/gender কে string হিসেবে নিলাম
    const docWithoutId: Omit<StudentDocDb, "_id"> = {
        studentId,
        name,
        batch,
        roll,
        division: body.division ?? "",
        schoolName: body.schoolName ?? "",
        schoolRoll: body.schoolRoll ?? "",
        schoolSection: body.schoolSection ?? "",
        address: body.address ?? "",
        fatherName: body.fatherName ?? "",
        motherName: body.motherName ?? "",
        guardianName: body.guardianName ?? "",
        guardianPhone: body.guardianPhone ?? "",
        gender: body.gender ?? "",
        photoUrl: body.photoUrl ?? "",
        isSuspended: !!body.isSuspended,
        createdAt: now,
        updatedAt: now,
    };

    const res = await colWrite.insertOne(docWithoutId);

    // API শেপে রিটার্ন (_id string করে)
    return NextResponse.json(
        { _id: res.insertedId.toString(), ...docWithoutId },
        { status: 201 }
    );
}
