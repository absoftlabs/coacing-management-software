// src/lib/baseUrl.ts
import "server-only";
import { headers } from "next/headers";

/**
 * সার্ভার/ক্লায়েন্ট উভয়ের জন্য নিরাপদ base URL রিটার্ন করে।
 */
export async function getBaseUrl(): Promise<string> {
    const env = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
    if (env) return env;

    const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
    if (vercel) return `https://${vercel}`;

    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    return `${proto}://${host}`;
}

/**
 * Client/Server দুই অবস্থাতেই fetch সঠিকভাবে কাজ করাবে।
 */
export async function api(path: string, init?: RequestInit): Promise<Response> {
    if (path.startsWith("http")) return fetch(path, init);

    if (typeof window !== "undefined") {
        // ক্লায়েন্টে relative URL কাজ করে
        return fetch(path, init);
    }

    const base = await getBaseUrl();
    return fetch(`${base}${path}`, init);
}
