// src/app/student-list/page.tsx
import StudentList, { type StudentRow } from "@/components/Student/StudentList";
import { api } from "@/lib/baseUrl";

type Batch = { _id: string; name: string };

async function getStudents(): Promise<StudentRow[]> {
    const res = await api("/api/students", { cache: "no-store" }).catch(() => null);
    if (!res || !res.ok) return [];
    const data = (await res.json()) as StudentRow[];
    return Array.isArray(data) ? data : [];
}

async function getBatches(): Promise<Batch[]> {
    const res = await api("/api/batches", { cache: "no-store" }).catch(() => null);
    if (!res || !res.ok) return [];
    const data = (await res.json()) as Batch[];
    return Array.isArray(data) ? data : [];
}

export default async function Page() {
    const [rows, batches] = await Promise.all([getStudents(), getBatches()]);
    const batchNames = batches.map((b) => b.name);
    return <StudentList rows={rows} batches={batchNames} />;
}
