// src/app/attendance/page.tsx
import MarkAttendance from "@/components/Attendance/MarkAttendance";
import StatusList from "@/components/Attendance/StatusList";
import { api } from "@/lib/baseUrl";

type BatchApi = { name?: string } | string;

async function fetchBatches(): Promise<string[]> {
    try {
        const res = await api("/api/batches", { cache: "no-store" });
        if (!res.ok) return [];

        const arr = (await res.json()) as BatchApi[];
        // normalize to string[]
        const names: string[] = [];
        for (const item of arr) {
            if (typeof item === "string") {
                if (item.trim()) names.push(item.trim());
            } else if (item && typeof item.name === "string" && item.name.trim()) {
                names.push(item.name.trim());
            }
        }
        // dedupe
        return Array.from(new Set(names));
    } catch {
        return [];
    }
}

export default async function Page() {
    const batches = await fetchBatches();

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Attendance</h1>

            {/* Mark section */}
            <MarkAttendance batches={batches} />

            {/* Present & Absent lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StatusList kind="Present" title="Present List" />
                <StatusList kind="Absent" title="Absent List" />
            </div>
        </div>
    );
}
