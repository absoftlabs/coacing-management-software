import ResultList, { type ResultRow } from "@/components/Result/ResultList";
import { getBaseUrl } from "@/lib/baseUrl";

async function fetchResults(): Promise<ResultRow[]> {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/api/results`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
}

async function fetchBatches(): Promise<string[]> {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/api/batches`, { cache: "no-store" });
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map((x: { name: string }) => x.name);
}

async function fetchClasses(): Promise<string[]> {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/api/classes`, { cache: "no-store" });
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map((x: { name: string }) => x.name);
}

export default async function Page() {
    const [rows, batches, classes] = await Promise.all([
        fetchResults(),
        fetchBatches(),
        fetchClasses(),
    ]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Result List</h1>
            <ResultList rows={rows} batches={batches} classes={classes} />
        </div>
    );
}
