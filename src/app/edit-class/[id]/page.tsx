import EditClass from "@/components/Class/EditClass";
import { api } from "@/lib/baseUrl";
import { Alert, AlertDescription } from "@/components/ui/alert";

async function fetchClass(id: string) {
    const res = await api(`/api/classes/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const item = await fetchClass(id);
    if (!item) {
        return (
            <div className="mx-auto max-w-3xl">
                <Alert variant="destructive">
                    <AlertDescription>Class not found.</AlertDescription>
                </Alert>
            </div>
        );
    }
    return <EditClass item={item} />;
}
