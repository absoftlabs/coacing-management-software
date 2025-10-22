import TeacherList, { type TeacherRow } from "@/components/Teacher/TeacherList";
import { getBaseUrl } from "@/lib/baseUrl";

async function fetchRows(): Promise<TeacherRow[]> {
    try {
        const base = await getBaseUrl(); // IMPORTANT: await
        const res = await fetch(`${base}/api/teachers`, { cache: "no-store" });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

export default async function Page() {
    const rows = await fetchRows();
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Teacher List</h1>
            <TeacherList rows={rows} />
        </div>
    );
}
