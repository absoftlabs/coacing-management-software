// src/app/api/students/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { StudentDoc, Division, Section, Gender } from "@/lib/types";
import { ObjectId, type Filter, type OptionalId } from "mongodb";

/** DB shape with _id:ObjectId */
type StudentDocDb = Omit<StudentDoc, "_id"> & { _id: ObjectId };

function random5(): string {
    return String(Math.floor(Math.random() * 100000)).padStart(5, "0");
}

/** GET /api/students?q=&batch=&roll=&suspended=true|false */
export async function GET(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") || "").trim();
        const batch = (searchParams.get("batch") || "").trim();
        const roll = (searchParams.get("roll") || "").trim();
        const suspended = searchParams.get("suspended");

        const db = await getDb();
        const col = db.collection<StudentDocDb>("students");

        const filter: Filter<StudentDocDb> = {};
        if (q) {
            const rx = { $regex: q, $options: "i" } as const;
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

        const items = await col.find(filter).sort({ createdAt: -1 }).toArray();

        const rows: StudentDoc[] = items.map(({ _id, ...rest }) => ({
            ...rest,
            _id: _id.toString(),
        }));

        return NextResponse.json(rows);
    } catch (error) {
        console.error("GET /api/students error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/** POST /api/students  (creates PCC-xxxxx id) */
export async function POST(req: Request): Promise<NextResponse> {
    try {
        let body: Partial<StudentDoc> | null = null;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const name = String(body.name ?? "").trim();
        const batch = String(body.batch ?? "").trim();
        const roll = String(body.roll ?? "").trim();
        if (!name || !batch || !roll) {
            return NextResponse.json({ error: "name, batch, roll are required" }, { status: 400 });
        }

        const division = (body.division || undefined) as Division | undefined;
        const schoolSection = (body.schoolSection || undefined) as Section | undefined;
        const gender = (body.gender || undefined) as Gender | undefined;

        const birthDate = body.birthDate ? String(body.birthDate) : undefined;
        
        let courseFee: number | undefined = undefined;
        if (body.courseFee !== undefined && body.courseFee !== null) {
            const fee = Number(body.courseFee);
            if (!isNaN(fee)) {
                courseFee = fee;
            }
        }

        const db = await getDb();
        const col = db.collection<StudentDocDb>("students");

        // allocate unique studentId (PCC-xxxxx)
        let studentId = "";
        for (let i = 0; i < 10; i++) {
            const candidate = `PCC-${random5()}`;
            const exists = await col.findOne({ studentId: candidate });
            if (!exists) { 
                studentId = candidate; 
                break; 
            }
        }
        if (!studentId) {
            return NextResponse.json({ error: "Failed to allocate studentId. Try again." }, { status: 500 });
        }

        const now = new Date().toISOString();

        const insertDoc: OptionalId<StudentDocDb> = {
            studentId,
            name,
            batch,
            roll,
            division,
            schoolName: body.schoolName ?? "",
            schoolRoll: body.schoolRoll ?? "",
            schoolSection,
            address: body.address ?? "",
            fatherName: body.fatherName ?? "",
            motherName: body.motherName ?? "",
            guardianName: body.guardianName ?? "",
            guardianPhone: body.guardianPhone ?? "",
            gender,
            photoUrl: body.photoUrl ?? "",
            isSuspended: !!body.isSuspended,
            birthDate,
            courseFee,
            createdAt: now,
            updatedAt: now,
        };

        const res = await col.insertOne(insertDoc as StudentDocDb);

        const response: StudentDoc = {
            ...insertDoc,
            _id: res.insertedId.toString(),
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error("POST /api/students error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}