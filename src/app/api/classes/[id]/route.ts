import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ClassDoc } from "@/lib/types";
import type { Prisma } from "@prisma/client";
import { resolveBatchId, prismaDeleteErrorResponse } from "@/lib/dbHelpers";

function toId(id: string): number {
    const n = Number(id);
    if (!Number.isInteger(n)) throw new Error("Invalid id");
    return n;
}

function serialize(x: { id: number; batch: { name: string } | null; days: Prisma.JsonValue; [key: string]: unknown }) {
    const { batch, days, ...rest } = x;
    return { ...rest, _id: String(x.id), batch: batch?.name ?? "", days: Array.isArray(days) ? days : [] };
}

// GET /api/classes/:id
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let classId: number;
    try {
        classId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await prisma.classSession.findUnique({ where: { id: classId }, include: { batch: true } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(serialize(item));
}

// PATCH /api/classes/:id
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let classId: number;
    try {
        classId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => null)) as Partial<ClassDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const data: Prisma.ClassSessionUpdateInput = {};
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.code === "string") data.code = body.code;
    if (typeof body.teacher === "string") data.teacher = body.teacher;
    if (Array.isArray(body.days)) data.days = body.days.map(String);
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.batch === "string") {
        data.batch = body.batch.trim()
            ? { connect: { id: await resolveBatchId(body.batch.trim()) } }
            : { disconnect: true };
    }

    try {
        const updated = await prisma.classSession.update({
            where: { id: classId },
            data,
            include: { batch: true },
        });
        return NextResponse.json(serialize(updated));
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}

// DELETE /api/classes/:id
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let classId: number;
    try {
        classId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        await prisma.classSession.delete({ where: { id: classId } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return prismaDeleteErrorResponse(error);
    }
}
