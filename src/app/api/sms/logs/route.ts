import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const audience = (searchParams.get("audience") || "").trim() as "" | "student" | "teacher";
        const batchId = (searchParams.get("batchId") || "").trim();

        const where: Prisma.SmsLogWhereInput = {};
        if (audience) where.audience = audience;
        if (batchId) where.batchName = batchId;

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
    } catch (error) {
        console.error("GET /api/sms/logs error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
