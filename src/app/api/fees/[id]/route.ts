import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findStudentByCode, prismaDeleteErrorResponse } from "@/lib/dbHelpers";

function toId(id: string): number {
    const n = Number(id);
    if (!Number.isInteger(n)) throw new Error("Invalid id");
    return n;
}

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

// GET /api/fees/:id
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let feeId: number;
    try {
        feeId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await prisma.fee.findUnique({
        where: { id: feeId },
        include: { student: { select: { studentId: true } } },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(serialize(item));
}

// PATCH /api/fees/:id
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let feeId: number;
    try {
        feeId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (typeof body.studentName === "string") data.studentName = body.studentName;
    if (typeof body.depositBy === "string") data.depositBy = body.depositBy;
    if (typeof body.receivedBy === "string") data.receivedBy = body.receivedBy;
    if (body.amount !== undefined && body.amount !== null) {
        const amount = Number(body.amount);
        if (isNaN(amount)) return NextResponse.json({ error: "Amount must be numeric" }, { status: 400 });
        data.amount = amount;
    }
    if (typeof body.studentId === "string" && body.studentId.trim()) {
        const student = await findStudentByCode(body.studentId.trim());
        if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
        data.studentRefId = student.id;
    }

    try {
        const updated = await prisma.fee.update({
            where: { id: feeId },
            data,
            include: { student: { select: { studentId: true } } },
        });
        return NextResponse.json(serialize(updated));
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}

// DELETE /api/fees/:id
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let feeId: number;
    try {
        feeId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        await prisma.fee.delete({ where: { id: feeId } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return prismaDeleteErrorResponse(error);
    }
}
