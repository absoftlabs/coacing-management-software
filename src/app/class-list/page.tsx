// src/app/class-list/page.tsx
import ClassList from "@/components/Class/ClassList";
import { getBaseUrl } from "@/lib/baseUrl";

type ClassItem = {
    _id: string;
    name: string;
    code: string;
    teacher?: string;
    batch?: string;
    days?: string[];
    isActive?: boolean;
};

async function getClasses(): Promise<ClassItem[]> {
    const base = await getBaseUrl();       // ← অবশ্যই await
    const res = await fetch(`${base}/api/classes`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as ClassItem[];
}

export default async function Page() {
    const rows = await getClasses();
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Class List</h1>
            <ClassList rows={rows} />
        </div>
    );
}
