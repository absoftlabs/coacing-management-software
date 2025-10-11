import React from "react";
import EditClass from "@/components/Class/EditClass";

async function fetchClass(id: string) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    const res = await fetch(`${base}/api/classes/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
}

export default async function Page({ params }: { params: { id: string } }) {
    const item = await fetchClass(params.id);
    if (!item) {
        return (
            <div className="p-6">
                <div className="alert alert-error">Not found</div>
            </div>
        );
    }
    return <EditClass item={item} />;
}
