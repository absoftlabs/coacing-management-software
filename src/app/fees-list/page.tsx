import FeesList from "@/components/Fees/FeesList";
import { getBaseUrl } from "@/lib/baseUrl";
import type { FeeDoc } from "@/lib/types";

async function fetchRows(): Promise<FeeDoc[]> {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/api/fees`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
}

export default async function Page() {
    const rows = await fetchRows();
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Fees Collection List</h1>
            <FeesList rows={rows} />
        </div>
    );
}
