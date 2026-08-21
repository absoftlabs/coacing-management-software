// src/app/api/batches/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/batches -> [{ _id, name, totalClass, totalStudent }]
export async function GET() {
    const batches = await prisma.batch.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: {
                    classes: true,
                    students: { where: { isSuspended: false } },
                },
            },
        },
    });

    const rows = batches.map((b) => ({
        _id: String(b.id),
        name: b.name,
        totalClass: b._count.classes,
        totalStudent: b._count.students,
    }));

    return NextResponse.json(rows);
}

// POST /api/batches -> { _id, name }
export async function POST(req: Request) {
    const body = (await req.json().catch(() => null)) as { name?: string } | null;
    const name = body?.name?.trim();
    if (!name) {
        return NextResponse.json({ error: "Batch name is required" }, { status: 400 });
    }

    const exists = await prisma.batch.findUnique({ where: { name } });
    if (exists) {
        return NextResponse.json({ error: "Batch name already exists" }, { status: 409 });
    }

    const batch = await prisma.batch.create({ data: { name } });

    return NextResponse.json({ _id: String(batch.id), name: batch.name }, { status: 201 });
}
