// src/lib/baseUrl.ts
import "server-only";
import { headers } from "next/headers";

/**
 * Server-only base URL resolver (async).
 * Priority:
 * 1) NEXT_PUBLIC_BASE_URL
 * 2) VERCEL_URL
 * 3) request headers (x-forwarded-*)
 * 4) fallback: http://localhost:3000
 */
export async function getBaseUrl(): Promise<string> {
    const explicit = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
    if (explicit) return explicit;

    const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
    if (vercel) return `https://${vercel}`;

    // Next 15: headers() promise হতে পারে — await করুন
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    return `${proto}://${host}`;
}

/**
 * Unified fetch helper:
 * - Client এ: relative path দিয়েই fetch হবে।
 * - Server এ: absolute URL বানিয়ে fetch হবে (getBaseUrl await সহ)।
 */
export async function api(path: string, init?: RequestInit): Promise<Response> {
    if (path.startsWith("http")) return fetch(path, init);

    if (typeof window !== "undefined") {
        // Client: relative URL যথেষ্ট
        return fetch(path, init);
    }

    const base = await getBaseUrl(); // <-- **await গুরুত্বপূর্ণ**
    return fetch(`${base}${path}`, init);
}
