// lib/baseUrl.ts
import { headers } from "next/headers";

export function getBaseUrl() {
    // যদি env সেট করা থাকে—ওটাই ব্যবহার
    if (process.env.NEXT_PUBLIC_BASE_URL) {
        return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
    }
    // নইলে অন-দ্য-ফ্লাই হেডার থেকে বানান (production-friendly)
    const h = headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("x-forwarded-host") ?? h.get("host");
    return `${proto}://${host}`;
}
