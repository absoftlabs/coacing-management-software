// src/app/api/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { resolveBatchId, findStudentByCode } from "@/lib/dbHelpers";

type AttendanceStatus = "Present" | "Absent";

export type AttendanceDoc = {
    _id?: string;
    date: string;
    studentId: string;
    studentName: string;
    batch: string;
    status: AttendanceStatus;
    createdAt: string;
    updatedAt: string;
};

function ymd(date?: string) {
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    return new Date().toISOString().slice(0, 10);
}

function serialize(a: {
    id: number;
    date: string;
    studentName: string;
    student: { studentId: string };
    batch: { name: string };
    status: string;
    createdAt: Date;
    updatedAt: Date;
}) {
    return {
        _id: String(a.id),
        date: a.date,
        studentId: a.student.studentId,
        studentName: a.studentName,
        batch: a.batch.name,
        status: a.status,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
    };
}

// GET /api/attendance?date=YYYY-MM-DD&status=Present|Absent&q=
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const date = ymd(searchParams.get("date") || undefined);
    const status = searchParams.get("status") as AttendanceStatus | null;
    const q = (searchParams.get("q") || "").trim();

    const where: Prisma.AttendanceWhereInput = { date };
    if (status === "Present" || status === "Absent") where.status = status;
    if (q) {
        where.OR = [
            { student: { studentId: { contains: q } } },
            { studentName: { contains: q } },
            { batch: { name: { contains: q } } },
        ];
    }

    const items = await prisma.attendance.findMany({
        where,
        orderBy: { studentName: "asc" },
        include: { batch: true, student: { select: { studentId: true } } },
    });
    return NextResponse.json(items.map(serialize));
}

// PUT /api/attendance  body: { date?, studentId, studentName, batch, status: "Present"|"Absent" }
export async function PUT(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as
        | { date?: string; studentId?: string; studentName?: string; batch?: string; status?: string }
        | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const date = ymd(body.date);
    const studentCode = String(body.studentId || "").trim();
    const studentName = String(body.studentName || "").trim();
    const batchName = String(body.batch || "").trim();
    const status = body.status === "Present" || body.status === "Absent" ? body.status : null;

    if (!studentCode || !studentName || !batchName || !status) {
        return NextResponse.json({ error: "studentId, studentName, batch, status required" }, { status: 400 });
    }

    const student = await findStudentByCode(studentCode);
    if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    const batchId = await resolveBatchId(batchName);

    const attendance = await prisma.attendance.upsert({
        where: { date_studentRefId: { date, studentRefId: student.id } },
        update: { studentName, batchId, status },
        create: { date, studentRefId: student.id, studentName, batchId, status },
    });

    return NextResponse.json({ ok: true, upsertedId: String(attendance.id) });
}

// DELETE /api/attendance  body: { date?, studentId }
export async function DELETE(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as { date?: string; studentId?: string } | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const date = ymd(body.date);
    const studentCode = String(body.studentId || "").trim();
    if (!studentCode) return NextResponse.json({ error: "studentId required" }, { status: 400 });

    const student = await findStudentByCode(studentCode);
    if (!student) return NextResponse.json({ ok: false });

    try {
        await prisma.attendance.delete({ where: { date_studentRefId: { date, studentRefId: student.id } } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false });
    }
}
