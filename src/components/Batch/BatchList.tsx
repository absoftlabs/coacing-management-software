// src/components/Batch/BatchList.tsx
"use client";

import { useMemo, useRef, useState } from "react";

type Batch = {
    _id: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
};

type ClassItem = {
    _id: string;
    name: string;
    code?: string;
    batch: string;            // batch name reference
    isActive?: boolean;
};

type StudentItem = {
    _id: string;
    batch: string;            // batch name reference
    isSuspended?: boolean;
};

type Props = {
    initialBatches: Batch[];
    initialClasses: ClassItem[];
    initialStudents: StudentItem[];
};

export default function BatchList({ initialBatches, initialClasses, initialStudents }: Props) {
    const [batches, setBatches] = useState<Batch[]>(initialBatches);
    const [classes] = useState<ClassItem[]>(initialClasses);
    const [students] = useState<StudentItem[]>(initialStudents);

    // modal state
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const [editing, setEditing] = useState<Batch | null>(null);
    const [name, setName] = useState<string>("");

    const rows = useMemo(
        () =>
            batches.map((b) => {
                const totalClass = classes.filter((c) => c.batch === b.name).length;
                const totalStudent = students.filter((s) => s.batch === b.name && !s.isSuspended).length;
                return { ...b, totalClass, totalStudent };
            }),
        [batches, classes, students]
    );

    function openCreate() {
        setEditing(null);
        setName("");
        dialogRef.current?.showModal();
    }
    function openEdit(b: Batch) {
        setEditing(b);
        setName(b.name);
        dialogRef.current?.showModal();
    }
    function closeModal() {
        dialogRef.current?.close();
    }

    async function onSave() {
        if (!name.trim()) return;
        if (editing) {
            // update
            const res = await fetch(`/api/batches/${editing._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
            });
            if (res.ok) {
                setBatches((prev) => prev.map((x) => (x._id === editing._id ? { ...x, name: name.trim() } : x)));
                closeModal();
            } else {
                alert("Update failed");
            }
        } else {
            // create
            const res = await fetch("/api/batches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
            });
            if (res.ok) {
                const created = (await res.json()) as Batch;
                setBatches((prev) => [created, ...prev]);
                closeModal();
            } else {
                alert("Create failed");
            }
        }
    }

    async function onDelete(id: string) {
        if (!confirm("Delete this batch?")) return;
        const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
        if (res.ok) setBatches((prev) => prev.filter((x) => x._id !== id));
        else alert("Delete failed");
    }

    return (
        <>
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="flex items-center justify-between">
                        <h2 className="card-title">Batches</h2>
                        <button className="btn btn-primary" onClick={openCreate}>Add Batch</button>
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
                                {rows.map((r, i) => (
                                    <tr key={r._id}>
                                        <td>{i + 1}</td>
                                        <td>{r.name}</td>
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
                                {!rows.length && (
                                    <tr>
                                        <td colSpan={5} className="text-center opacity-60 py-10">No batches</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">{editing ? "Edit Batch" : "Add Batch"}</h3>

                    <div className="form-control mt-4">
                        <label className="label">
                            <span className="label-text">Batch Name</span>
                        </label>
                        <input
                            className="input input-bordered"
                            value={name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            placeholder="e.g. HSC-26 Batch A"
                        />
                    </div>

                    <div className="modal-action">
                        <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                        <button className="btn btn-primary" onClick={onSave}>{editing ? "Update Batch" : "Save Batch"}</button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
}
