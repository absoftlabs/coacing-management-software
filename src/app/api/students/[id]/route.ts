// src/app/api/students/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StudentDoc } from "@/lib/types";
import type { Prisma } from "@prisma/client";
import { resolveBatchId, prismaDeleteErrorResponse } from "@/lib/dbHelpers";

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

    const allowed: (keyof StudentDoc)[] = [
        "name", "roll", "division", "schoolName", "schoolRoll", "schoolSection",
        "address", "fatherName", "motherName", "guardianName", "guardianPhone", "gender",
        "photoUrl", "isSuspended", "birthDate", "courseFee",
    ];

    const data: Prisma.StudentUpdateInput = {};

    for (const f of allowed) {
        if (Object.prototype.hasOwnProperty.call(body, f)) {
            const value = body[f];
            if (value !== undefined) {
                (data as Record<string, unknown>)[f] = value;
            }
        }
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
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
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
