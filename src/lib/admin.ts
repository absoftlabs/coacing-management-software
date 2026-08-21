import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Admin } from "@prisma/client";

export async function ensureDemoAdmin(): Promise<Admin | null> {
    const email = process.env.DEMO_ADMIN_EMAIL?.trim();
    const password = process.env.DEMO_ADMIN_PASSWORD;
    if (!email || !password) return null;

    const username =
        process.env.DEMO_ADMIN_USERNAME?.trim() || email;

    const exists = await prisma.admin.findUnique({ where: { email } });
    if (exists) return exists;

    const passwordHash = await bcrypt.hash(password, 10);

    return prisma.admin.create({
        data: {
            email,
            username,
            passwordHash,
            role: "admin",
            passwordChangedAt: new Date(),
        },
    });
}
