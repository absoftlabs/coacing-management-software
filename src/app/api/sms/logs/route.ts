import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const audience = (searchParams.get("audience") || "").trim() as "" | "student" | "teacher";

    const where: Prisma.SmsLogWhereInput = {};
    if (audience) where.audience = audience;

    const items = await prisma.smsLog.findMany({
        where,
        orderBy: { sentAt: "desc" },
        take: 200,
    });

    return NextResponse.json(
        items.map(({ id, batchName, templateId, ...rest }) => ({
            ...rest,
            _id: String(id),
            batchId: batchName ?? undefined,
            templateId: templateId !== null ? String(templateId) : undefined,
        }))
    );
}
