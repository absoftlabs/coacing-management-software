import SuspendedList from "@/components/Student/SuspendedList";
import { getBaseUrl } from "@/lib/baseUrl";

async function fetchSuspended() {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/students?suspended=true`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
}

export default async function Page() {
    const rows = await fetchSuspended();
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Suspended Students</h1>
            <SuspendedList rows={rows} />
        </div>
    );
}
