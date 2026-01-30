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
