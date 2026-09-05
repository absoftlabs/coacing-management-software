// src/app/api/sms/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

function serialize(t: { id: number }) {
    return { ...t, _id: String(t.id) };
}

// GET /api/sms/templates
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") || "").trim();

        const where: Prisma.SmsTemplateWhereInput = q
            ? { OR: [{ templateName: { contains: q } }, { templateBody: { contains: q } }] }
            : {};

        const docs = await prisma.smsTemplate.findMany({ where, orderBy: { updatedAt: "desc" } });
        return NextResponse.json(docs.map(serialize));
    } catch (error) {
        console.error("GET /api/sms/templates error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/sms/templates
export async function POST(req: NextRequest) {
    try {
        const body = (await req.json().catch(() => null)) as
            | { templateName?: string; templateBody?: string }
            | null;

        const templateName = (body?.templateName ?? "").trim();
        const templateBody = (body?.templateBody ?? "").trim();

        if (!templateName || !templateBody) {
            return NextResponse.json(
                { error: "Both templateName and templateBody are required." },
                { status: 400 }
            );
        }

        const created = await prisma.smsTemplate.create({ data: { templateName, templateBody } });

        return NextResponse.json(serialize(created), { status: 201 });
    } catch (error) {
        console.error("POST /api/sms/templates error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
