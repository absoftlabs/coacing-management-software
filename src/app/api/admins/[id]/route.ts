// src/app/api/admins/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

function toId(id: string): number {
    const n = Number(id);
    if (!Number.isInteger(n)) throw new Error("Invalid id");
    return n;
}

// DELETE /api/admins/:id — remove an admin account.
// Refuses to delete yourself or the last remaining admin, so the app can
// never end up with zero admin accounts able to log in.
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let adminId: number;
    try {
        adminId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const auth = await getAuthFromRequest(req);
    if (auth && Number(auth.sub) === adminId) {
        return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const target = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!target || target.role !== "admin") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const adminCount = await prisma.admin.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
        return NextResponse.json({ error: "At least one admin account must remain" }, { status: 400 });
    }

    await prisma.admin.delete({ where: { id: adminId } });
    return NextResponse.json({ ok: true });
}
