// src/lib/teacherAccount.ts
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// New and reset teacher logins start on this fixed password; the teacher is
// expected to change it themselves from the Change Password page afterward.
export const DEFAULT_TEACHER_PASSWORD = "123456";

function baseUsernameFor(teacherId: number, phone?: string | null): string {
    const trimmed = (phone ?? "").trim();
    return trimmed || `teacher${teacherId}`;
}

/** Creates a "teacher" login account for a teacher, retrying with a
 *  disambiguated username if the phone-derived one is already taken. */
export async function createTeacherAccount(
    teacherId: number,
    phone?: string | null
): Promise<{ username: string; password: string }> {
    const base = baseUsernameFor(teacherId, phone);
    const passwordHash = await bcrypt.hash(DEFAULT_TEACHER_PASSWORD, 10);

    for (const username of [base, `${base}-${teacherId}`]) {
        try {
            await prisma.admin.create({
                data: { username, passwordHash, role: "teacher", teacherId },
            });
            return { username, password: DEFAULT_TEACHER_PASSWORD };
        } catch (error) {
            const isUsernameConflict =
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002" &&
                ((error.meta?.target as string[] | undefined) ?? []).includes("username");
            if (!isUsernameConflict) throw error;
        }
    }

    throw new Error(`Could not allocate a unique login username for teacher ${teacherId}`);
}

/** Resets (or lazily creates) a teacher's login back to the fixed default
 *  password, returning it for one-time display to the admin. */
export async function resetTeacherPassword(
    teacherId: number,
    phone?: string | null
): Promise<{ username: string; password: string }> {
    const existing = await prisma.admin.findUnique({ where: { teacherId } });
    if (!existing) {
        return createTeacherAccount(teacherId, phone);
    }

    const passwordHash = await bcrypt.hash(DEFAULT_TEACHER_PASSWORD, 10);
    await prisma.admin.update({
        where: { id: existing.id },
        data: { passwordHash, passwordChangedAt: new Date() },
    });
    return { username: existing.username, password: DEFAULT_TEACHER_PASSWORD };
}
