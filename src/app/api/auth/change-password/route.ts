import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest, signAuthToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const auth = await getAuthFromRequest(req);
    if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as
        | { currentPassword?: string; newPassword?: string }
        | null;

    const currentPassword = body?.currentPassword ?? "";
    const newPassword = body?.newPassword ?? "";

    if (!currentPassword || !newPassword || newPassword.length < 8) {
        return NextResponse.json(
            { error: "Current password and a new password (min 8 chars) are required" },
            { status: 400 }
        );
    }

    const adminId = Number(auth.sub);
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!ok) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = new Date();
    await prisma.admin.update({
        where: { id: admin.id },
        data: { passwordHash, updatedAt: now, passwordChangedAt: now },
    });

    const token = await signAuthToken({
        sub: String(admin.id),
        role: "admin",
        email: admin.email,
        username: admin.username,
    });

    const res = NextResponse.json({ ok: true });
    setAuthCookie(res, token);
    return res;
}
