import StudentList from "@/components/Student/StudentList";
import { getBaseUrl } from "@/lib/baseUrl";
import type { StudentItem } from "@/app/student-list/page";

async function getSuspended(): Promise<StudentItem[]> {
    const base = await getBaseUrl(); // ← আবশ্যক
    const res = await fetch(`${base}/api/students?suspended=true`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as StudentItem[];
}

export default async function Page() {
    const rows = await getSuspended();
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Suspended Students</h1>
            <StudentList rows={rows} suspendedOnly />
        </div>
    );
}
