// src/app/api/students/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StudentDoc } from "@/lib/types";
import type { Prisma } from "@prisma/client";
import { resolveBatchId, prismaDeleteErrorResponse, prismaUpdateErrorResponse } from "@/lib/dbHelpers";

function toId(id: string): number {
    const n = Number(id);
    if (!Number.isInteger(n)) throw new Error("Invalid id");
    return n;
}

function serialize(s: {
    id: number;
    batch: { name: string };
    [key: string]: unknown;
}) {
    const { batch, ...rest } = s;
    return { ...rest, _id: String(s.id), batch: batch.name };
}

// GET /api/students/:id
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let studentId: number;
    try {
        studentId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await prisma.student.findUnique({ where: { id: studentId }, include: { batch: true } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(serialize(item));
}

// PATCH /api/students/:id
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let studentId: number;
    try {
        studentId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => null)) as Partial<StudentDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const stringFields: (keyof StudentDoc)[] = [
        "name", "roll", "division", "schoolName", "schoolRoll", "schoolSection",
        "address", "fatherName", "motherName", "guardianName", "guardianPhone", "gender",
        "photoUrl", "birthDate",
    ];

    const data: Prisma.StudentUpdateInput = {};

    for (const f of stringFields) {
        if (Object.prototype.hasOwnProperty.call(body, f) && body[f] !== undefined && body[f] !== null) {
            (data as Record<string, unknown>)[f] = String(body[f]);
        }
    }

    if (Object.prototype.hasOwnProperty.call(body, "isSuspended")) {
        data.isSuspended = body.isSuspended === true || (body.isSuspended as unknown) === "true";
    }

    if (Object.prototype.hasOwnProperty.call(body, "courseFee")) {
        const raw = body.courseFee;
        const fee = raw === null || raw === undefined || raw === ("" as unknown) ? null : Number(raw);
        if (fee !== null && isNaN(fee)) {
            return NextResponse.json({ error: "courseFee must be a number" }, { status: 400 });
        }
        data.courseFee = fee;
    }

    if (typeof body.batch === "string" && body.batch.trim()) {
        data.batch = { connect: { id: await resolveBatchId(body.batch.trim()) } };
    }

    try {
        const updated = await prisma.student.update({
            where: { id: studentId },
            data,
            include: { batch: true },
        });
        return NextResponse.json(serialize(updated));
    } catch (error) {
        return prismaUpdateErrorResponse(error);
    }
}

// DELETE /api/students/:id
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let studentId: number;
    try {
        studentId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        await prisma.student.delete({ where: { id: studentId } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return prismaDeleteErrorResponse(error);
    }
}
