import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rateLimit";

function timingSafeEqualString(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
    // Disabled in production unless explicitly opted into (one-time setup only).
    const inProduction = process.env.NODE_ENV === "production";
    const allowInProd = process.env.ALLOW_SEED_IN_PRODUCTION === "true";
    if (inProduction && !allowInProd) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!rateLimit(`seed:${clientIp(req)}`, 10, 60_000)) {
        return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
    }

    const secret = req.headers.get("x-seed-secret") || "";
    const mode = (req.nextUrl.searchParams.get("mode") || "upsert").toLowerCase();
    const expected = process.env.SEED_SECRET || "";
    if (!expected || !timingSafeEqualString(secret, expected)) {
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
