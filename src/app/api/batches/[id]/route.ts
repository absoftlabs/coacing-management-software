import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { prismaDeleteErrorResponse } from "@/lib/dbHelpers";

function toId(id: string): number {
    const n = Number(id);
    if (!Number.isInteger(n)) throw new Error("Invalid id");
    return n;
}

function serialize(batch: { id: number; name: string; createdAt: Date; updatedAt: Date }) {
    return { ...batch, _id: String(batch.id) };
}

// GET /api/batches/:id
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let batchId: number;
    try {
        batchId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(serialize(item));
}

// PATCH /api/batches/:id  body: { name }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let batchId: number;
    try {
        batchId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => null)) as { name?: string } | null;
    const name = body?.name?.trim();
    if (!name) return NextResponse.json({ error: "Batch name is required" }, { status: 400 });

    const dup = await prisma.batch.findFirst({ where: { name, id: { not: batchId } } });
    if (dup) return NextResponse.json({ error: "Batch name already exists" }, { status: 409 });

    try {
        const item = await prisma.batch.update({ where: { id: batchId }, data: { name } });
        return NextResponse.json(serialize(item));
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}

// DELETE /api/batches/:id
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let batchId: number;
    try {
        batchId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        await prisma.batch.delete({ where: { id: batchId } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return prismaDeleteErrorResponse(error);
    }
}
