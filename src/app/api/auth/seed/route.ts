import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";

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

    const db = await getDb();
    const col = db.collection("admins");

    if (mode === "check") {
        const exists = await col.findOne({ email });
        return NextResponse.json({ ok: true, email, exists: !!exists });
    }

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 10);

    await col.updateOne(
        { email },
        {
            $set: {
                email,
                username,
                passwordHash,
                role: "admin",
                updatedAt: now,
                passwordChangedAt: now,
            },
            $setOnInsert: {
                createdAt: now,
            },
        },
        { upsert: true }
    );

    return NextResponse.json({ ok: true, email, mode: "upsert" });
}
