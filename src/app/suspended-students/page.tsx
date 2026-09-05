import StudentList, { type StudentRow } from "@/components/Student/StudentList";
import { api } from "@/lib/baseUrl";

async function getSuspended(): Promise<StudentRow[]> {
    const res = await api("/api/students?suspended=true", { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as StudentRow[];
}

export default async function Page() {
    const rows = await getSuspended();
    return (
        <div className="space-y-6">
            <StudentList rows={rows} suspendedOnly />
        </div>
    );
}
