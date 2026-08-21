// src/app/api/students/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Division, Section, Gender } from "@/lib/types";
import type { Prisma } from "@prisma/client";
import { resolveBatchId } from "@/lib/dbHelpers";

function random5(): string {
    return String(Math.floor(Math.random() * 100000)).padStart(5, "0");
}

function serialize(s: {
    id: number;
    studentId: string;
    name: string;
    batch: { name: string };
    roll: string;
    division: string | null;
    schoolName: string | null;
    schoolRoll: string | null;
    schoolSection: string | null;
    address: string | null;
    fatherName: string | null;
    motherName: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    gender: string | null;
    photoUrl: string | null;
    isSuspended: boolean;
    birthDate: string | null;
    courseFee: number | null;
    createdAt: Date;
    updatedAt: Date;
}) {
    const { batch, ...rest } = s;
    return { ...rest, _id: String(s.id), batch: batch.name };
}

/** GET /api/students?q=&batch=&roll=&suspended=true|false */
export async function GET(req: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") || "").trim();
        const batch = (searchParams.get("batch") || "").trim();
        const roll = (searchParams.get("roll") || "").trim();
        const suspended = searchParams.get("suspended");

        const where: Prisma.StudentWhereInput = {};
        if (q) {
            where.OR = [
                { name: { contains: q } },
                { studentId: { contains: q } },
                { batch: { name: { contains: q } } },
                { roll: { contains: q } },
                { guardianName: { contains: q } },
                { guardianPhone: { contains: q } },
            ];
        }
        if (batch) where.batch = { name: batch };
        if (roll) where.roll = roll;
        if (suspended === "true") where.isSuspended = true;
        else if (suspended === "false") where.isSuspended = false;

        const items = await prisma.student.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: { batch: true },
        });

        return NextResponse.json(items.map(serialize));
    } catch (error) {
        console.error("GET /api/students error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/** POST /api/students  (creates PCC-xxxxx id) */
export async function POST(req: Request): Promise<NextResponse> {
    try {
        let body: Record<string, unknown> | null = null;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const name = String(body.name ?? "").trim();
        const batchName = String(body.batch ?? "").trim();
        const roll = String(body.roll ?? "").trim();
        if (!name || !batchName || !roll) {
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

        const batchId = await resolveBatchId(batchName);

        // allocate unique studentId (PCC-xxxxx)
        let studentId = "";
        for (let i = 0; i < 10; i++) {
            const candidate = `PCC-${random5()}`;
            const exists = await prisma.student.findUnique({ where: { studentId: candidate } });
            if (!exists) {
                studentId = candidate;
                break;
            }
        }
        if (!studentId) {
            return NextResponse.json({ error: "Failed to allocate studentId. Try again." }, { status: 500 });
        }

        const created = await prisma.student.create({
            data: {
                studentId,
                name,
                batchId,
                roll,
                division,
                schoolName: (body.schoolName as string) ?? "",
                schoolRoll: (body.schoolRoll as string) ?? "",
                schoolSection,
                address: (body.address as string) ?? "",
                fatherName: (body.fatherName as string) ?? "",
                motherName: (body.motherName as string) ?? "",
                guardianName: (body.guardianName as string) ?? "",
                guardianPhone: (body.guardianPhone as string) ?? "",
                gender,
                photoUrl: (body.photoUrl as string) ?? "",
                isSuspended: !!body.isSuspended,
                birthDate,
                courseFee,
            },
            include: { batch: true },
        });

        return NextResponse.json(serialize(created), { status: 201 });
    } catch (error) {
        console.error("POST /api/students error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
