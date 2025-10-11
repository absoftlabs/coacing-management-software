import EditStudent from "@/components/Student/EditStudent";
import { getBaseUrl } from "@/lib/baseUrl";

async function fetchStudent(id: string) {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/students/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
}

export default async function Page({ params }: { params: { id: string } }) {
    const item = await fetchStudent(params.id);
    if (!item) return <div className="p-6"><div className="alert alert-error">Not found</div></div>;
    return <EditStudent item={item} />;
}
