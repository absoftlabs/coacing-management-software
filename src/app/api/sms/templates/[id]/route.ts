import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prismaDeleteErrorResponse, prismaUpdateErrorResponse } from "@/lib/dbHelpers";

function toId(id: string): number {
    const n = Number(id);
    if (!Number.isInteger(n)) throw new Error("Invalid id");
    return n;
}

function serialize(t: { id: number }) {
    return { ...t, _id: String(t.id) };
}

// GET /api/sms/templates/:id
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let templateId: number;
    try {
        templateId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await prisma.smsTemplate.findUnique({ where: { id: templateId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(serialize(item));
}

// PUT /api/sms/templates/:id
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let templateId: number;
    try {
        templateId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => null)) as
        | { templateName?: string; templateBody?: string }
        | null;

    const templateName = body?.templateName?.trim();
    const templateBody = body?.templateBody?.trim();
    if (!templateName || !templateBody) {
        return NextResponse.json(
            { error: "Both templateName and templateBody are required." },
            { status: 400 }
        );
    }

    try {
        const updated = await prisma.smsTemplate.update({
            where: { id: templateId },
            data: { templateName, templateBody },
        });
        return NextResponse.json(serialize(updated));
    } catch (error) {
        return prismaUpdateErrorResponse(error);
    }
}

// DELETE /api/sms/templates/:id
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let templateId: number;
    try {
        templateId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        await prisma.smsTemplate.delete({ where: { id: templateId } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return prismaDeleteErrorResponse(error);
    }
}
