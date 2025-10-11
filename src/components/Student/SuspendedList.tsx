"use client";

import { useMemo, useState } from "react";

type Row = {
    _id: string;
    studentId: string;
    name: string;
    batch: string;
    roll: string;
    division?: string;
    isSuspended?: boolean;
};

export default function SuspendedList({ rows }: { rows: Row[] }) {
    const [q, setQ] = useState("");
    const [data, setData] = useState(rows);

    const filtered = useMemo(() => {
        const s = q.toLowerCase();
        return data.filter(r =>
            (r.isSuspended === true) &&
            (!q || r.name.toLowerCase().includes(s) || r.studentId.toLowerCase().includes(s) || r.batch.toLowerCase().includes(s) || r.roll.toLowerCase().includes(s))
        );
    }, [q, data]);

    async function onReadmit(id: string) {
        const res = await fetch(`/api/students/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isSuspended: false }),
        });
        if (res.ok) {
            setData(prev => prev.map(x => x._id === id ? { ...x, isSuspended: false } : x));
        } else alert("Re-admit failed");
    }

    async function onDelete(id: string) {
        if (!confirm("Delete student?")) return;
        const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
        if (res.ok) setData(prev => prev.filter(x => x._id !== id));
        else alert("Delete failed");
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex items-center justify-between gap-3">
                    <input className="input input-bordered" placeholder="Search suspended students..." value={q} onChange={e => setQ(e.target.value)} />
                </div>

                <div className="overflow-x-auto mt-4">
                    <table className="table table-zebra">
                        <thead>
                            <tr>
                                <th>SL</th>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Batch</th>
                                <th>Roll</th>
                                <th>Division</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r, i) => (
                                <tr key={r._id}>
                                    <td>{i + 1}</td>
                                    <td className="font-mono">{r.studentId}</td>
                                    <td>{r.name}</td>
                                    <td>{r.batch}</td>
                                    <td>{r.roll}</td>
                                    <td>{r.division || "-"}</td>
                                    <td className="text-right">
                                        <div className="join">
                                            <a href={`/edit-student/${r._id}`} className="btn btn-sm join-item">Edit</a>
                                            <button onClick={() => onReadmit(r._id)} className="btn btn-sm btn-success join-item">Re-admit</button>
                                            <button onClick={() => onDelete(r._id)} className="btn btn-sm btn-outline join-item">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!filtered.length && (
                                <tr>
                                    <td colSpan={7} className="text-center opacity-60 py-10">No suspended students</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
