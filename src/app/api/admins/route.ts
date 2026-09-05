// src/app/api/admins/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function serialize(a: { id: number; email: string | null; username: string; createdAt: Date }) {
    return { _id: String(a.id), email: a.email, username: a.username, createdAt: a.createdAt };
}

// GET /api/admins — admin-role accounts only (not teacher logins)
export async function GET() {
    try {
        const admins = await prisma.admin.findMany({
            where: { role: "admin" },
            orderBy: { createdAt: "asc" },
        });
        return NextResponse.json(admins.map(serialize));
    } catch (error) {
        console.error("GET /api/admins error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/admins  body: { email, username, password }
export async function POST(req: NextRequest) {
    try {
        const body = (await req.json().catch(() => null)) as
            | { email?: string; username?: string; password?: string }
            | null;
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const email = (body.email ?? "").trim().toLowerCase();
        const username = (body.username ?? "").trim();
        const password = body.password ?? "";

        if (!email || !username || !password) {
            return NextResponse.json({ error: "Email, username and password are required" }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const created = await prisma.admin.create({
            data: { email, username, passwordHash, role: "admin" },
        });
        return NextResponse.json(serialize(created), { status: 201 });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const target = (error.meta?.target as string[] | undefined) ?? [];
            if (target.includes("email")) {
                return NextResponse.json({ error: "Email already in use" }, { status: 409 });
            }
            if (target.includes("username")) {
                return NextResponse.json({ error: "Username already in use" }, { status: 409 });
            }
        }
        console.error("POST /api/admins error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
