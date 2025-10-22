// src/components/Teacher/TeacherList.tsx
"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { TeacherDoc } from "@/lib/types";

export type TeacherRow = TeacherDoc & { totalAssignedClass?: number };

export default function TeacherList({
    rows,
    suspendedOnly = false,
}: {
    rows: TeacherRow[];
    suspendedOnly?: boolean;
}) {
    const [q, setQ] = useState("");
    const [data, setData] = useState<TeacherRow[]>(rows);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return data.filter((r) => {
            const okQ =
                !s ||
                r.name.toLowerCase().includes(s) ||
                (r.primarySubject || "").toLowerCase().includes(s);
            const okSusp = suspendedOnly ? r.isSuspended === true : r.isSuspended !== true;
            return okQ && okSusp;
        });
    }, [q, data, suspendedOnly]);

    async function onDelete(id?: string) {
        if (!id) return;
        if (!confirm("Delete this teacher?")) return;
        const res = await fetch(`/api/teachers/${id}`, { method: "DELETE" });
        if (res.ok) setData((prev) => prev.filter((x) => x._id !== id));
        else alert("Delete failed");
    }

    async function onSuspend(id?: string) {
        if (!id) return;
        if (!confirm("Suspend this teacher?")) return;
        const res = await fetch(`/api/teachers/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isSuspended: true }),
        });
        if (res.ok) setData((prev) => prev.map((x) => (x._id === id ? { ...x, isSuspended: true } : x)));
        else alert("Suspend failed");
    }

    async function onAppoint(id?: string) {
        if (!id) return;
        if (!confirm("Re-appoint this teacher?")) return;
        const res = await fetch(`/api/teachers/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isSuspended: false }),
        });
        if (res.ok) setData((prev) => prev.map((x) => (x._id === id ? { ...x, isSuspended: false } : x)));
        else alert("Failed to appoint");
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex items-center gap-3 justify-between bg-base-200 rounded p-4">
                    <input
                        className="input input-bordered"
                        placeholder="Search by name/subject"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    {!suspendedOnly && <a href="/add-teacher" className="btn btn-primary">Add Teacher</a>}
                </div>

                <div className="overflow-x-auto mt-4">
                    <table className="table table-zebra">
                        <thead>
                            <tr>
                                <th>SL</th>
                                <th>Photo</th>
                                <th>Name</th>
                                <th>Primary Subject</th>
                                <th>Total Assigned Class</th>
                                <th>Join Date</th>
                                <th>Salary</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r, i) => (
                                <tr key={r._id}>
                                    <td>{i + 1}</td>
                                    <td>
                                        {r.imageUrl ? (
                                            <Image
                                                src={r.imageUrl}
                                                alt={r.name}
                                                width={48}
                                                height={48}
                                                className="mask mask-squircle w-12 h-12 object-cover"
                                            />
                                        ) : (
                                            <div className="mask mask-squircle w-12 h-12 bg-base-200 flex items-center justify-center text-xs text-base-content/50">
                                                No Pic
                                            </div>
                                        )}
                                    </td>
                                    <td>{r.name}</td>
                                    <td>{r.primarySubject}</td>
                                    <td>{r.totalAssignedClass ?? 0}</td>
                                    <td>{r.joinDate || "-"}</td>
                                    <td>{r.salary !== undefined ? r.salary : "-"}</td>
                                    <td className="text-right">
                                        <div className="join">
                                            <a href={`/edit-teacher/${r._id}`} className="btn btn-sm join-item">Edit</a>
                                            {!suspendedOnly ? (
                                                <button onClick={() => onSuspend(r._id)} className="btn btn-sm btn-warning join-item">
                                                    Suspend
                                                </button>
                                            ) : (
                                                <button onClick={() => onAppoint(r._id)} className="btn btn-sm btn-success join-item">
                                                    Appoint
                                                </button>
                                            )}
                                            <button onClick={() => onDelete(r._id)} className="btn btn-sm btn-outline join-item">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!filtered.length && (
                                <tr>
                                    <td colSpan={8} className="text-center opacity-60 py-10">No teachers</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
