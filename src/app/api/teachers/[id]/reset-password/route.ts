// src/app/api/teachers/[id]/reset-password/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetTeacherPassword } from "@/lib/teacherAccount";

function toId(id: string): number {
    const n = Number(id);
    if (!Number.isInteger(n)) throw new Error("Invalid id");
    return n;
}

// POST /api/teachers/:id/reset-password
// Resets (or lazily creates) the teacher's login and returns the new
// plaintext password once for the admin to hand to the teacher.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    let teacherId: number;
    try {
        teacherId = toId(id);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 });

    try {
        const credentials = await resetTeacherPassword(teacherId, teacher.phone);
        return NextResponse.json(credentials);
    } catch (error) {
        console.error("POST /api/teachers/:id/reset-password error:", error);
        return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }
}
