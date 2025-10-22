import dynamic from "next/dynamic";
import { getBaseUrl } from "@/lib/baseUrl";
import type { TeacherDoc } from "@/lib/types";
import EditTeacher from "@/components/Teacher/EditTeacher";


async function fetchItem(id: string): Promise<TeacherDoc | null> {
    try {
        const base = await getBaseUrl(); // IMPORTANT: await
        const res = await fetch(`${base}/api/teachers/${id}`, { cache: "no-store" });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export default async function Page({ params }: { params: { id: string } }) {
    const item = await fetchItem(params.id);
    if (!item) return <div className="p-6">Not found</div>;
    return <EditTeacher item={item} />;
}
