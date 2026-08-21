import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get("secret") || "";
    const mode = (req.nextUrl.searchParams.get("mode") || "upsert").toLowerCase();
    const expected = process.env.SEED_SECRET || "";
    if (!expected || secret !== expected) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = (process.env.DEMO_ADMIN_EMAIL || "").trim();
    const password = process.env.DEMO_ADMIN_PASSWORD || "";
    const username = (process.env.DEMO_ADMIN_USERNAME || email).trim();

    if (!email || !password) {
        return NextResponse.json(
            { error: "Missing DEMO_ADMIN_EMAIL or DEMO_ADMIN_PASSWORD" },
            { status: 400 }
        );
    }

    if (mode === "check") {
        const exists = await prisma.admin.findUnique({ where: { email } });
        return NextResponse.json({ ok: true, email, exists: !!exists });
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.admin.upsert({
        where: { email },
        update: {
            username,
            passwordHash,
            role: "admin",
            updatedAt: now,
            passwordChangedAt: now,
        },
        create: {
            email,
            username,
            passwordHash,
            role: "admin",
            passwordChangedAt: now,
        },
    });

    return NextResponse.json({ ok: true, email, mode: "upsert" });
}
