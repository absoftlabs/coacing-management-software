import { api } from "@/lib/baseUrl";
import type { TeacherDoc } from "@/lib/types";
import EditTeacher from "@/components/Teacher/EditTeacher";
import { Alert, AlertDescription } from "@/components/ui/alert";

async function fetchItem(id: string): Promise<TeacherDoc | null> {
    try {
        const res = await api(`/api/teachers/${id}`, { cache: "no-store" });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const item = await fetchItem(id);
    if (!item) {
        return (
            <div className="mx-auto max-w-3xl">
                <Alert variant="destructive">
                    <AlertDescription>Teacher not found.</AlertDescription>
                </Alert>
            </div>
        );
    }
    return <EditTeacher item={item} />;
}
