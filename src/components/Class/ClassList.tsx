"use client";

import { useMemo, useState } from "react";

type Row = {
    _id: string;
    name: string;
    code: string;
    teacher?: string;
    batch?: string;
    days?: string[];
    isActive?: boolean;
};

export default function ClassList({ rows }: { rows: Row[] }) {
    const [q, setQ] = useState("");
    const [data, setData] = useState(rows);

    const filtered = useMemo(() => {
        if (!q) return data;
        const s = q.toLowerCase();
        return data.filter((r) =>
            (r.name || "").toLowerCase().includes(s) ||
            (r.code || "").toLowerCase().includes(s) ||
            (r.teacher || "").toLowerCase().includes(s) ||
            (r.batch || "").toLowerCase().includes(s)
        );
    }, [q, data]);

    async function onDelete(id: string) {
        if (!confirm("Delete this class?")) return;
        const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
        if (res.ok) setData(prev => prev.filter(x => x._id !== id));
        else alert("Failed to delete");
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex items-center justify-between gap-3">
                    <input
                        className="input input-bordered w-full max-w-xs"
                        placeholder="Search by name / code / teacher / batch"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <a href="/add-class" className="btn btn-primary">Add Class</a>
                </div>

                <div className="overflow-x-auto mt-4">
                    <table className="table table-zebra">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Teacher</th>
                                <th>Batch</th>
                                <th>Days</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r) => (
                                <tr key={r._id}>
                                    <td className="font-medium">{r.name}</td>
                                    <td>{r.code}</td>
                                    <td>{r.teacher || "-"}</td>
                                    <td>{r.batch || "-"}</td>
                                    <td className="whitespace-nowrap">{(r.days || []).join(", ") || "-"}</td>
                                    <td>
                                        <span className={`badge ${r.isActive ? "badge-success" : "badge-ghost"}`}>
                                            {r.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="join">
                                            <a href={`/edit-class/${r._id}`} className="btn btn-sm join-item">Edit</a>
                                            <button onClick={() => onDelete(r._id)} className="btn btn-sm btn-outline join-item">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!filtered.length && (
                                <tr>
                                    <td colSpan={7} className="text-center opacity-60 py-10">No classes</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
