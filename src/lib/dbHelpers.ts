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

/** Maps a failed update call to the right status: 404 when the row is gone,
 *  409 on a unique-constraint clash, 400 for anything else (bad input,
 *  invalid date, etc.) — instead of blanket-reporting every failure as 404,
 *  which hides real bugs and reports the wrong status to the client. */
export function prismaUpdateErrorResponse(error: unknown): NextResponse {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (error.code === "P2002") {
            return NextResponse.json({ error: "A record with this value already exists" }, { status: 409 });
        }
    }
    console.error("Update failed:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
