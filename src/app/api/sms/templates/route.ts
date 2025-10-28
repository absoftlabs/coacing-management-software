// src/app/api/sms/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
    ObjectId,
    type OptionalId,
    type Filter,
} from "mongodb";
import type { SmsTemplateDoc } from "@/lib/sms/types";

/** DB shape (what’s stored in Mongo) */
interface SmsTemplateDb {
    _id: ObjectId;
    templateName: string;
    templateBody: string;
    createdAt: string;
    updatedAt: string;
}

/** Insert shape (lets Mongo generate _id) */
type SmsTemplateInsert = OptionalId<SmsTemplateDb>;

// GET /api/sms/templates
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    const db = await getDb();
    const col = db.collection<SmsTemplateDb>("sms_templates");

    const filter: Filter<SmsTemplateDb> = {};
    if (q) {
        const rx = { $regex: q, $options: "i" };
        filter.$or = [{ templateName: rx }, { templateBody: rx }];
    }

    const docs = await col.find(filter).sort({ updatedAt: -1 }).toArray();

    // Return with ObjectId intact (matches SmsTemplateDoc if it expects ObjectId)
    const rows: SmsTemplateDoc[] = docs.map((t) => ({
        _id: t._id,
        templateName: t.templateName,
        templateBody: t.templateBody,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
    }));

    return NextResponse.json(rows);
}

// POST /api/sms/templates
export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as
        | { templateName?: string; templateBody?: string }
        | null;

    const templateName = (body?.templateName ?? "").trim();
    const templateBody = (body?.templateBody ?? "").trim();

    if (!templateName || !templateBody) {
        return NextResponse.json(
            { error: "Both templateName and templateBody are required." },
            { status: 400 }
        );
    }

    const now = new Date().toISOString();

    const db = await getDb();
    const col = db.collection<OptionalId<SmsTemplateDb>>("sms_templates");

    // ✅ Use the insert type that does NOT require _id
    const insertDoc: SmsTemplateInsert = {
        templateName,
        templateBody,
        createdAt: now,
        updatedAt: now,
    };

    const res = await col.insertOne(insertDoc);

    // Send back a normalized document (ObjectId preserved)
    const created: SmsTemplateDoc = {
        _id: res.insertedId,
        templateName,
        templateBody,
        createdAt: now,
        updatedAt: now,
    };

    return NextResponse.json(created, { status: 201 });
}
