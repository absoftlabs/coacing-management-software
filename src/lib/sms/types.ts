// src/lib/sms/types.ts
import type { ObjectId } from "mongodb";
import type { ResultDoc } from "@/lib/types";


/**
 * SMS Template document
 */
export interface SmsTemplateDoc {
    _id?: ObjectId; // optional when inserting, Mongo will auto-generate
    templateName: string;
    templateBody: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Supported audience types
 */
export type SmsAudience = "student" | "teacher";

/**
 * Delivery status
 */
export type SmsStatus = "sent" | "failed" | "skip-no-phone";

/**
 * SMS Log document
 */
export interface SmsLogDoc {
    _id?: ObjectId;
    audience: SmsAudience;

    // audience-specific fields
    batchId?: string;
    studentId?: string;
    teacherId?: string;

    templateId?: string;
    preview: string;
    phone: string;
    status: SmsStatus;

    // provider metadata (optional)
    providerId?: string;
    sentAt: string;
    error?: string;
}


export interface RenderContext {
    coachingName?: string;
    student?: {
        name: string;
        studentId: string;
        roll?: string;
        batch?: string;
    };
    teacher?: {
        name: string;
        teacherId?: string;
        subject?: string;
    };
    result?: ResultDoc;
}