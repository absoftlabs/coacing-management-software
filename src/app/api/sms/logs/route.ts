import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { type Filter } from "mongodb";
import type { SmsLogDoc } from "@/lib/sms/types";

type SmsLogDb = Required<SmsLogDoc>;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const audience = (searchParams.get("audience") || "").trim() as "" | "student" | "teacher";

    const db = await getDb();
    const col = db.collection<SmsLogDb>("sms_log");

    const filter: Filter<SmsLogDb> = {};
    if (audience) filter.audience = audience;

    const items = await col.find(filter).sort({ sentAt: -1 }).limit(200).toArray();
    return NextResponse.json(items.map(i => ({ ...i, _id: i._id?.toString() })));
}
