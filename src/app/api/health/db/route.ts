// src/app/api/health/db/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

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
        const db = await getDb();
        // DB-তে টাচ করার জন্য শুধু কালেকশন লিস্ট নিচ্ছি
        const names: string[] = (await db.listCollections().toArray()).map(c => String(c.name));
        return NextResponse.json({ ok: true, db: db.databaseName, collections: names });
    } catch (e: unknown) {
        return NextResponse.json(
            { ok: false, error: getErrorMessage(e) },
            { status: 500 }
        );
    }
}
