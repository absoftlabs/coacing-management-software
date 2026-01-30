import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type AdminDoc = {
    _id?: ObjectId;
    email: string;
    username: string;
    passwordHash: string;
    role: "admin";
    createdAt: string;
    updatedAt: string;
    passwordChangedAt?: string;
};

export async function ensureDemoAdmin(): Promise<AdminDoc | null> {
    const email = process.env.DEMO_ADMIN_EMAIL?.trim();
    const password = process.env.DEMO_ADMIN_PASSWORD;
    if (!email || !password) return null;

    const username =
        process.env.DEMO_ADMIN_USERNAME?.trim() || email;

    const db = await getDb();
    const col = db.collection<AdminDoc>("admins");

    const exists = await col.findOne({ email });
    if (exists) return exists;

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 10);

    const doc: AdminDoc = {
        email,
        username,
        passwordHash,
        role: "admin",
        createdAt: now,
        updatedAt: now,
        passwordChangedAt: now,
    };

    const res = await col.insertOne(doc);
    return { ...doc, _id: res.insertedId };
}
