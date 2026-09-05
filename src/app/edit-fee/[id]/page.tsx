// src/app/edit-fee/[id]/page.tsx
import { notFound } from "next/navigation";
import EditFeeForm from "@/components/Fees/EditFeeForm";
import type { FeeDoc } from "@/lib/types";
import { api } from "@/lib/baseUrl";

async function fetchFee(id: string): Promise<FeeDoc | null> {
    const res = await api(`/api/fees/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const fee = await fetchFee(id);
    if (!fee) notFound();

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <EditFeeForm initial={fee} />
        </div>
    );
}
