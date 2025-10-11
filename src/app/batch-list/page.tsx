import BatchList from "@/components/Batch/BatchList";
import { getBaseUrl } from "@/lib/baseUrl"; // আগের সমাধান A থেকে

async function fetchBatches() {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/batches`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
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
