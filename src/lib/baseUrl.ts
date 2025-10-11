// src/lib/baseUrl.ts
import "server-only";
import { headers } from "next/headers";

/**
 * Server-only base URL resolver.
 * Priority:
 * 1) NEXT_PUBLIC_BASE_URL (explicit, with scheme)
 * 2) VERCEL_URL (add https://)
 * 3) Request headers (x-forwarded-proto/host)
 * 4) Fallback: http://localhost:3000
 */
export async function getBaseUrl(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;

  const h = await headers(); // <-- FIX: await
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
