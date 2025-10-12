// src/app/batch-list/page.tsx
import BatchList, { type BatchRow } from "@/components/Batch/BatchList";
import { api } from "@/lib/baseUrl";

/** /api/batches => BatchRow[] */
async function fetchBatches(): Promise<BatchRow[]> {
    try {
        const res = await api("/api/batches", { cache: "no-store" });
        if (!res.ok) return [];
        const data = (await res.json()) as Array<{
            _id: string;
            name: string;
            totalClass: number;
            totalStudent: number;
        }>;
        // ডাটা স্যানিটি: সংখ্যা না হলে 0 করে দিন
        return data.map((x) => ({
            _id: String(x._id),
            name: String(x.name),
            totalClass: Number.isFinite(x.totalClass) ? x.totalClass : 0,
            totalStudent: Number.isFinite(x.totalStudent) ? x.totalStudent : 0,
        }));
    } catch {
        return [];
    }
}

export default async function Page() {
    const rows = await fetchBatches();
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Batch List</h1>
            <BatchList rows={rows} />
        </div>
    );
}
