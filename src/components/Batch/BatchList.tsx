"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BatchRow } from "@/lib/types";

type Props = { rows: BatchRow[] };

export default function BatchList({ rows }: Props) {
    const [data, setData] = useState<BatchRow[]>(rows);
    const [q, setQ] = useState("");
    const [saving, setSaving] = useState(false);

    // modal state
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [name, setName] = useState("");

    const filtered = useMemo(() => {
        if (!q) return data;
        const s = q.toLowerCase();
        return data.filter((r) => r.name.toLowerCase().includes(s));
    }, [q, data]);

    function openAdd() {
        setEditId(null);
        setName("");
        dialogRef.current?.showModal();
    }

    function openEdit(item: BatchRow) {
        setEditId(item._id);
        setName(item.name);
        dialogRef.current?.showModal();
    }

    function closeModal() {
        dialogRef.current?.close();
    }

    async function saveBatch() {
        if (!name.trim()) {
            alert("Batch name is required");
            return;
        }
        setSaving(true);
        try {
            if (editId) {
                const res = await fetch(`/api/batches/${editId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: name.trim() }),
                });
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw new Error(j.error || "Update failed");
                }
                const updated = await res.json();
                setData((prev) =>
                    prev.map((r) =>
                        r._id === editId ? { ...r, name: updated.name } : r
                    )
                );
            } else {
                const res = await fetch("/api/batches", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: name.trim() }),
                });
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw new Error(j.error || "Create failed");
                }
                const created = await res.json();
                // নতুন ব্যাচে counts 0 দিয়ে দেখাই
                setData((prev) => [{ _id: created._id, name: created.name, totalClass: 0, totalStudent: 0 }, ...prev]);
            }
            closeModal();
        } catch (e: any) {
            alert(e.message || String(e));
        } finally {
            setSaving(false);
        }
    }

    async function onDelete(id: string) {
        if (!confirm("Delete this batch?")) return;
        const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
        if (res.ok) setData((prev) => prev.filter((x) => x._id !== id));
        else {
            const j = await res.json().catch(() => ({}));
            alert(j.error || "Failed to delete");
        }
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            className="input input-bordered w-full sm:w-80"
                            placeholder="Search batch..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={openAdd}>Add Batch</button>
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
                                    <td className="font-medium">{r.name}</td>
                                    <td>{r.totalClass}</td>
                                    <td>{r.totalStudent}</td>
                                    <td className="text-right">
                                        <div className="join">
                                            <button className="btn btn-sm join-item" onClick={() => openEdit(r)}>Edit</button>
                                            <button className="btn btn-sm btn-outline join-item" onClick={() => onDelete(r._id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!filtered.length && (
                                <tr>
                                    <td colSpan={5} className="text-center opacity-60 py-10">No batches</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">{editId ? "Edit Batch" : "Add Batch"}</h3>
                    <div className="py-4">
                        <label className="label"><span className="label-text">Batch Name</span></label>
                        <input
                            className="input input-bordered w-full"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. HSC-26 Batch A"
                        />
                    </div>
                    <div className="modal-action">
                        <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                        <button className="btn btn-primary" onClick={saveBatch} disabled={saving}>
                            {saving ? "Saving..." : (editId ? "Update Batch" : "Save Batch")}
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
}
