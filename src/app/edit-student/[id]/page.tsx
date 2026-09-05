// src/app/edit-student/[id]/page.tsx
import EditStudent, { type StudentItem } from "@/components/Student/EditStudent";
import { api } from "@/lib/baseUrl";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Params = { id: string };
type Props = { params: Params } | { params: Promise<Params> };

async function getParams(p: Props["params"]): Promise<Params> {
    return Promise.resolve(p as Params | Promise<Params>);
}

async function fetchStudent(id: string): Promise<StudentItem | null> {
    const res = await api(`/api/students/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
}

export default async function Page(props: Props) {
    const { id } = await getParams(props.params);
    const item = await fetchStudent(id);

    if (!item) {
        return (
            <div className="mx-auto max-w-4xl space-y-3">
                <Alert variant="destructive">
                    <AlertDescription>Student not found.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return <EditStudent item={item} />;
}
