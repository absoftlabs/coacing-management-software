// src/app/edit-fee/[id]/page.tsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import EditFeeForm from "@/components/Fees/EditFeeForm";
import type { FeeDoc } from "@/lib/types";

async function getBaseUrl() {
    // prefer env first
    const env = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
    if (env) return env;

    // ✅ await headers() instead of headers()
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("x-forwarded-host") ?? h.get("host");
    return `${proto}://${host}`;
}

async function fetchFee(id: string): Promise<FeeDoc | null> {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/api/fees/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
}

export default async function Page({ params }: { params: { id: string } }) {
    const fee = await fetchFee(params.id);
    if (!fee) notFound();

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Edit Fee</h1>
            <EditFeeForm initial={fee} />
        </div>
    );
}
