// src/components/Batch/BatchList.tsx
"use client";

import { useMemo, useRef, useState } from "react";

export type BatchRow = {
    _id: string;
    name: string;
    totalClass: number;
    totalStudent: number;
};

type Props = {
    /** সার্ভার থেকে পাওয়া ব্যাচ রো-গুলোর তালিকা */
    rows: BatchRow[];
};

export default function BatchList({ rows }: Props) {
    const [data, setData] = useState<BatchRow[]>(rows);
    const [q, setQ] = useState("");
    const [editing, setEditing] = useState<BatchRow | null>(null);
    const [name, setName] = useState("");
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    const filtered = useMemo(() => {
        if (!q.trim()) return data;
        const rx = new RegExp(q.trim(), "i");
        return data.filter((r) => rx.test(r.name));
    }, [q, data]);

    function openAdd() {
        setEditing(null);
        setName("");
        dialogRef.current?.showModal();
    }
    function openEdit(item: BatchRow) {
        setEditing(item);
        setName(item.name);
        dialogRef.current?.showModal();
    }
    function closeModal() {
        dialogRef.current?.close();
    }

    async function saveBatch() {
        const body = { name: name.trim() };
        if (!body.name) return;

        if (editing) {
            // update
            const res = await fetch(`/api/batches/${editing._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                alert(j.error || "Failed to update");
                return;
            }
            const updated = (await res.json()) as { _id: string; name: string };
            setData((prev) =>
                prev.map((x) =>
                    x._id === updated._id ? { ...x, name: updated.name } : x
                )
            );
        } else {
            // create
            const res = await fetch("/api/batches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                alert(j.error || "Failed to create");
                return;
            }
            const created = (await res.json()) as { _id: string; name: string };
            // নতুন রোতে শুরুতে 0 কাউন্ট রাখছি (api থেকে লিস্ট রিফ্রেশ করলে সঠিক আসবে)
            const row: BatchRow = {
                _id: created._id,
                name: created.name,
                totalClass: 0,
                totalStudent: 0,
            };
            setData((prev) => [row, ...prev]);
        }
        closeModal();
    }

    async function onDelete(id: string) {
        if (!confirm("Delete this batch?")) return;
        const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            alert(j.error || "Failed to delete");
            return;
        }
        setData((prev) => prev.filter((x) => x._id !== id));
    }

    return (
        <>
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="flex flex-col md:flex-row gap-3 items-end justify-between">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Search batch</span>
                            </label>
                            <input
                                className="input input-bordered"
                                placeholder="Type batch name…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={openAdd}>
                            Add Batch
                        </button>
                    </div>

                    <div className="overflow-x-auto mt-4">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>SL</th>
                                    <th>Batch Name</th>
                                    <th>Total Class</th>
                                    <th>Total Student</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r, i) => (
                                    <tr key={r._id}>
                                        <td>{i + 1}</td>
                                        <td>{r.name}</td>
                                        <td>{r.totalClass}</td>
                                        <td>{r.totalStudent}</td>
                                        <td className="text-right">
                                            <div className="join">
                                                <button
                                                    className="btn btn-xs join-item"
                                                    onClick={() => openEdit(r)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-outline join-item"
                                                    onClick={() => onDelete(r._id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!filtered.length && (
                                    <tr>
                                        <td colSpan={5} className="text-center opacity-60 py-10">
                                            No batches
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-2">
                        {editing ? "Edit Batch" : "Add Batch"}
                    </h3>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Batch Name</span>
                        </label>
                        <input
                            className="input input-bordered"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. HSC-26 Batch A"
                        />
                    </div>

                    <div className="modal-action">
                        <button className="btn btn-ghost" onClick={closeModal}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={saveBatch}>
                            {editing ? "Update Batch" : "Save Batch"}
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
}
