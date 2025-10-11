// src/app/batch-list/page.tsx
import BatchList from "@/components/Batch/BatchList";
import { getBaseUrl } from "@/lib/baseUrl";

// --- Shared Types (BatchList.tsx এর সাথে মিল রেখে) ---
type Batch = { _id: string; name: string; createdAt?: string; updatedAt?: string };
type ClassItem = { _id: string; name: string; code?: string; batch: string; isActive?: boolean };
type StudentItem = { _id: string; batch: string; isSuspended?: boolean };

async function fetchJSON<T>(path: string): Promise<T> {
    const base = getBaseUrl();
    const res = await fetch(`${base}${path}`, { cache: "no-store" }).catch(() => null);
    if (!res || !res.ok) return [] as unknown as T;
    const data = (await res.json()) as T;
    return data;
}

export default async function Page() {
    const [initialBatches, initialClasses, initialStudents] = await Promise.all([
        fetchJSON<Batch[]>("/api/batches"),
        fetchJSON<ClassItem[]>("/api/classes"),
        fetchJSON<StudentItem[]>("/api/students"),
    ]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Batch List</h1>
            <BatchList
                initialBatches={initialBatches}
                initialClasses={initialClasses}
                initialStudents={initialStudents}
            />
        </div>
    );
}
