// src/app/edit-student/[id]/page.tsx
import EditStudent from "@/components/Student/EditStudent";
import { api } from "@/lib/baseUrl";

/** Next 15: params কখনও Promise হতে পারে */
type Params = { id: string };
type Props = { params: Params } | { params: Promise<Params> };

async function getParams(p: Props["params"]): Promise<Params> {
    // Promise হোক বা না হোক — resolve করে ফেলি
    // eslint-disable-next-line @typescript-eslint/await-thenable
    return await Promise.resolve(p as Params | Promise<Params>);
}

async function fetchStudent(id: string) {
    // ✅ একীভূত api() helper — Client/Server দুই জায়গাতেই সেফ
    const res = await api(`/api/students/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
}

export default async function Page(props: Props) {
    const { id } = await getParams(props.params);
    const item = await fetchStudent(id);

    if (!item) {
        return (
            <div className="max-w-4xl mx-auto space-y-3">
                <h1 className="text-2xl font-semibold">Edit Student</h1>
                <div className="alert alert-error">Student not found.</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Edit Student</h1>
            <EditStudent item={item} />
        </div>
    );
}
