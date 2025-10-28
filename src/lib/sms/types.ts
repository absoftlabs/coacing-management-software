// src/lib/sms/types.ts
import type { ObjectId } from "mongodb";

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
