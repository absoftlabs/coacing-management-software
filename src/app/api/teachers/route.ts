// src/app/api/teachers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

function serialize(t: { id: number }) {
    return { ...t, _id: String(t.id) };
}

export async function GET(req: NextRequest) {
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
}

export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as {
        name?: string;
        phone?: string;
        imageUrl?: string;
        primarySubject?: string;
        joinDate?: string;
        salary?: number;
    } | null;

    if (!body?.name) {
        return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const created = await prisma.teacher.create({
        data: {
            name: body.name.trim(),
            phone: body.phone?.trim() || undefined,
            imageUrl: body.imageUrl || undefined,
            primarySubject: body.primarySubject?.trim() || undefined,
            joinDate: body.joinDate || undefined,
            salary: body.salary !== undefined && body.salary !== null ? Number(body.salary) : undefined,
        },
    });

    return NextResponse.json(serialize(created), { status: 201 });
}
