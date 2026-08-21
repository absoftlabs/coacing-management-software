import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Maps a failed delete/update Prisma call to a 404 (not found) or 409 (still
 *  referenced by other rows, e.g. a batch that still has students) response. */
export function prismaDeleteErrorResponse(error: unknown): NextResponse {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (error.code === "P2003" || error.code === "P2014") {
            return NextResponse.json(
                { error: "Cannot delete: still referenced by other records" },
                { status: 409 }
            );
        }
    }
    throw error;
}

/** Finds a Batch by name, creating it if it doesn't exist yet (mirrors the old
 *  Mongo behavior where `batch` was a free-text string with no FK enforcement). */
export async function resolveBatchId(name: string): Promise<number> {
    const batch = await prisma.batch.upsert({
        where: { name },
        update: {},
        create: { name },
    });
    return batch.id;
}

/** Looks up a Student by its public code (PCC-xxxxx). Returns null if not found. */
export async function findStudentByCode(studentId: string) {
    return prisma.student.findUnique({ where: { studentId } });
}
