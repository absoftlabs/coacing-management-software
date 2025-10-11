import StudentList from "@/components/Student/StudentList";
import { getBaseUrl } from "@/lib/baseUrl";

async function fetchStudents() {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/students?suspended=false`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
}

async function fetchBatches() {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/batches`, { cache: "no-store" });
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map((x: any) => x.name);
}

export default async function Page() {
    const [rows, batches] = await Promise.all([fetchStudents(), fetchBatches()]);
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Students</h1>
            <StudentList rows={rows} batches={batches} />
        </div>
    );
}
