import ClassList from "@/components/Class/ClassList";
import { getBaseUrl } from "@/lib/baseUrl";

async function fetchClasses() {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/classes`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
}

export default async function Page() {
    const rows = await fetchClasses();
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Class List</h1>
            <ClassList rows={rows} />
        </div>
    );
}
