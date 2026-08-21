import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ClassDoc } from "@/lib/types";
import type { Prisma } from "@prisma/client";
import { resolveBatchId } from "@/lib/dbHelpers";

function serialize(x: { id: number; batch: { name: string } | null; days: Prisma.JsonValue; [key: string]: unknown }) {
    const { batch, days, ...rest } = x;
    return { ...rest, _id: String(x.id), batch: batch?.name ?? "", days: Array.isArray(days) ? days : [] };
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    const where: Prisma.ClassSessionWhereInput = q
        ? {
            OR: [
                { name: { contains: q } },
                { code: { contains: q } },
                { teacher: { contains: q } },
                { batch: { name: { contains: q } } },
            ],
        }
        : {};

    const items = await prisma.classSession.findMany({ where, include: { batch: true } });

    return NextResponse.json(items.map(serialize));
}

export async function POST(req: Request) {
    const body = (await req.json()) as Partial<ClassDoc>;
    if (!body.name || !body.code) {
        return NextResponse.json({ error: "name & code are required" }, { status: 400 });
    }

    const batchName = body.batch?.trim() || "";
    const batchId = batchName ? await resolveBatchId(batchName) : undefined;

    const created = await prisma.classSession.create({
        data: {
            name: body.name.trim(),
            code: body.code.trim(),
            teacher: body.teacher?.trim() || "",
            batchId,
            days: Array.isArray(body.days) ? body.days : [],
            isActive: body.isActive ?? true,
        },
        include: { batch: true },
    });

    return NextResponse.json(serialize(created), { status: 201 });
}
