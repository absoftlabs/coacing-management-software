import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { findStudentByCode } from "@/lib/dbHelpers";

function serialize(f: {
    id: number;
    student: { studentId: string };
    studentName: string;
    amount: number;
    depositBy: string;
    receivedBy: string;
    createdAt: Date;
    updatedAt: Date;
}) {
    return {
        _id: String(f.id),
        studentId: f.student.studentId,
        studentName: f.studentName,
        amount: f.amount,
        depositBy: f.depositBy,
        receivedBy: f.receivedBy,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
    };
}

// GET /api/fees
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    const where: Prisma.FeeWhereInput = q
        ? {
            OR: [
                { studentName: { contains: q } },
                { student: { studentId: { contains: q } } },
                { depositBy: { contains: q } },
            ],
        }
        : {};

    const items = await prisma.fee.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { student: { select: { studentId: true } } },
    });

    return NextResponse.json(items.map(serialize));
}

// POST /api/fees
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const studentCode = String(body.studentId || "").trim();
    const studentName = String(body.studentName || "").trim();
    const depositBy = String(body.depositBy || "").trim();
    const receivedBy = String(body.receivedBy || "").trim();
    const amount = Number(body.amount || 0);

    if (!studentCode || !studentName || !depositBy || !receivedBy || !amount) {
        return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const student = await findStudentByCode(studentCode);
    if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const created = await prisma.fee.create({
        data: {
            studentRefId: student.id,
            studentName,
            depositBy,
            receivedBy,
            amount,
        },
        include: { student: { select: { studentId: true } } },
    });

    return NextResponse.json(serialize(created), { status: 201 });
}
