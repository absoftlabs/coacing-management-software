import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { ensureDemoAdmin } from "@/lib/admin";
import { signAuthToken, setAuthCookie } from "@/lib/auth";

type AdminDoc = {
    _id: ObjectId;
    email: string;
    username: string;
    passwordHash: string;
    role: "admin";
};

export async function POST(req: NextRequest) {
    try {
        await ensureDemoAdmin();

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

        const db = await getDb();
        const col = db.collection<AdminDoc>("admins");

        const admin = await col.findOne({
            $or: [{ email: identifier }, { username: identifier }],
        });

        if (!admin || !admin.passwordHash) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const ok = await bcrypt.compare(password, admin.passwordHash);
        if (!ok) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const token = await signAuthToken({
            sub: admin._id.toString(),
            role: "admin",
            email: admin.email,
            username: admin.username,
        });

        const res = NextResponse.json({
            ok: true,
            admin: { email: admin.email, username: admin.username },
        });
        setAuthCookie(res, token);
        return res;
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("POST /api/auth/login error:", err);
        return NextResponse.json({ error: "Login failed", detail: msg }, { status: 500 });
    }
}
