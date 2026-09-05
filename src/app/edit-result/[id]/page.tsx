// src/app/edit-result/[id]/page.tsx
import { notFound } from "next/navigation";
import EditResult from "@/components/Result/EditResult";
import type { ResultDoc } from "@/lib/types";
import { api } from "@/lib/baseUrl";

async function fetchResult(id: string): Promise<ResultDoc | null> {
    const res = await api(`/api/results/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await fetchResult(id);
    if (!result) notFound();

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <EditResult initial={result} />
        </div>
    );
}
