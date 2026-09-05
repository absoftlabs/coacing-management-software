import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAuthToken, setAuthCookie } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
    try {
        if (!rateLimit(`login:${clientIp(req)}`, 10, 60_000)) {
            return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
        }

        const body = (await req.json().catch(() => null)) as
            | { identifier?: string; password?: string }
            | null;

        const identifier = (body?.identifier ?? "").trim();
        const password = body?.password ?? "";

        if (!identifier || !password) {
            return NextResponse.json(
                { error: "Identifier and password are required" },
                { status: 400 }
            );
        }

        const admin = await prisma.admin.findFirst({
            where: { OR: [{ email: identifier }, { username: identifier }] },
            include: { teacher: true },
        });

        // Always run bcrypt.compare (against a dummy hash when no admin matches)
        // so a missing-account response takes the same time as a wrong-password one.
        const hash = admin?.passwordHash ?? "$2b$10$CwTycUXWue0Thq9StjUM0uJ8s34SNFqOhKQpjeTVnGvGtfJC4nOTC";
        const ok = await bcrypt.compare(password, hash);
        if (!admin || !ok) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        if (admin.role === "teacher" && admin.teacher?.isSuspended) {
            return NextResponse.json({ error: "This account has been suspended" }, { status: 403 });
        }

        const role = admin.role === "teacher" ? "teacher" : "admin";
        const token = await signAuthToken({
            sub: String(admin.id),
            role,
            email: admin.email ?? undefined,
            username: admin.username,
            teacherId: admin.teacherId ?? undefined,
        });

        const res = NextResponse.json({
            ok: true,
            admin: { email: admin.email, username: admin.username, role },
        });
        setAuthCookie(res, token);
        return res;
    } catch (err: unknown) {
        console.error("POST /api/auth/login error:", err);
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}
