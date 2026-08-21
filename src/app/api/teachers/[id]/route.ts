import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { TeacherDoc } from "@/lib/types";
import { prismaDeleteErrorResponse } from "@/lib/dbHelpers";

function toId(id: string): number {
    const n = Number(id);
    if (!Number.isInteger(n)) throw new Error("Invalid id");
    return n;
}

function serialize(t: { id: number }) {
    return { ...t, _id: String(t.id) };
}

function toNum(v: unknown): number | undefined {
    if (v === null || v === undefined || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

// GET
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let teacherId: number;
    try {
        teacherId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(serialize(item));
}

// PATCH
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let teacherId: number;
    try {
        teacherId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => null)) as Partial<TeacherDoc> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.phone === "string") data.phone = body.phone.trim();
    if (typeof body.imageUrl === "string") data.imageUrl = body.imageUrl.trim();
    if (typeof body.primarySubject === "string") data.primarySubject = body.primarySubject.trim();
    if (typeof body.joinDate === "string") data.joinDate = body.joinDate;
    const sal = toNum(body.salary);
    if (sal !== undefined) data.salary = sal;
    if (typeof body.isSuspended === "boolean") data.isSuspended = body.isSuspended;

    try {
        const updated = await prisma.teacher.update({ where: { id: teacherId }, data });
        return NextResponse.json(serialize(updated));
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}

// DELETE
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let teacherId: number;
    try {
        teacherId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        await prisma.teacher.delete({ where: { id: teacherId } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return prismaDeleteErrorResponse(error);
    }
}
