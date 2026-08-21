// src/app/api/health/db/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try {
        return JSON.stringify(err);
    } catch {
        return "Unknown error";
    }
}

export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({ ok: true, db: "mysql" });
    } catch (e: unknown) {
        return NextResponse.json(
            { ok: false, error: getErrorMessage(e) },
            { status: 500 }
        );
    }
}
