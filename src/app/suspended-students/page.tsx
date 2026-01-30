import StudentList from "@/components/Student/StudentList";
import { api } from "@/lib/baseUrl";
import type { StudentItem } from "@/app/student-list/page";

async function getSuspended(): Promise<StudentItem[]> {
    const res = await api("/api/students?suspended=true", { cache: "no-store" });
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
