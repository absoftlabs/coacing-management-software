// src/app/api/teachers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { createTeacherAccount } from "@/lib/teacherAccount";

function serialize(t: { id: number }) {
    return { ...t, _id: String(t.id) };
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") || "").trim();
        const suspended = searchParams.get("suspended");

        const where: Prisma.TeacherWhereInput = {};
        if (suspended === "true") where.isSuspended = true;
        else if (suspended === "false") where.isSuspended = false;
        if (q) {
            where.OR = [
                { name: { contains: q } },
                { primarySubject: { contains: q } },
                { teacherCode: { contains: q } },
            ];
        }

        const items = await prisma.teacher.findMany({ where, orderBy: { createdAt: "desc" } });
        return NextResponse.json(items.map(serialize));
    } catch (error) {
        console.error("GET /api/teachers error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json().catch(() => null)) as {
            name?: string;
            phone?: string;
            imageUrl?: string;
            primarySubject?: string;
            joinDate?: string;
            salary?: number;
        } | null;

        const phone = body?.phone?.trim();
        if (!body?.name || !phone) {
            return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
        }

        const created = await prisma.teacher.create({
            data: {
                name: body.name.trim(),
                phone,
                imageUrl: body.imageUrl || undefined,
                primarySubject: body.primarySubject?.trim() || undefined,
                joinDate: body.joinDate || undefined,
                salary: body.salary !== undefined && body.salary !== null ? Number(body.salary) : undefined,
            },
        });

        // A teacher account doubles as a login (role "teacher", restricted to
        // marking attendance). If this fails, don't leave a teacher record
        // with no way to ever log in.
        let credentials: { username: string; password: string };
        try {
            credentials = await createTeacherAccount(created.id, phone);
        } catch (error) {
            await prisma.teacher.delete({ where: { id: created.id } });
            throw error;
        }

        return NextResponse.json({ ...serialize(created), credentials }, { status: 201 });
    } catch (error) {
        console.error("POST /api/teachers error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
