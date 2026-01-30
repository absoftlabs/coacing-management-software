import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getAuthFromRequest, signAuthToken, setAuthCookie } from "@/lib/auth";

type AdminDoc = {
    _id: ObjectId;
    email: string;
    username: string;
    passwordHash: string;
    role: "admin";
    updatedAt?: string;
    passwordChangedAt?: string;
};

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

    const db = await getDb();
    const col = db.collection<AdminDoc>("admins");

    const admin = await col.findOne({ _id: new ObjectId(auth.sub) });
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!ok) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = new Date().toISOString();
    await col.updateOne(
        { _id: admin._id },
        { $set: { passwordHash, updatedAt: now, passwordChangedAt: now } }
    );

    const token = await signAuthToken({
        sub: admin._id.toString(),
        role: "admin",
        email: admin.email,
        username: admin.username,
    });

    const res = NextResponse.json({ ok: true });
    setAuthCookie(res, token);
    return res;
}
