import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
    try {
        const db = await getDb();
        // collections list just to touch the DB
        const names = (await db.listCollections().toArray()).map(c => c.name);
        return NextResponse.json({ ok: true, db: db.databaseName, collections: names });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
    }
}
