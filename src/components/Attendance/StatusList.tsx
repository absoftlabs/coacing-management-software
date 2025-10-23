"use client";

import { useEffect, useState } from "react";
import type { AttendanceDoc } from "@/app/api/attendance/route";
import { IconChecks, IconX } from "@tabler/icons-react";

type Props = {
    kind: "Present" | "Absent";
    title: string;
};

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

// Batch API may return either an array of strings or objects with name
type BatchApiRow = string | { name?: string | null; _id?: string | null };

export default function StatusList({ kind, title }: Props) {
    const [date, setDate] = useState<string>(today());
    const [batch, setBatch] = useState<string>(""); // selected batch filter
    const [batches, setBatches] = useState<string[]>([]); // list of batch names
    const [rows, setRows] = useState<Array<AttendanceDoc & { _id: string }>>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingBatches, setLoadingBatches] = useState<boolean>(true);

    // Load batch options (type-safe, no "any")
    useEffect(() => {
        async function loadBatches() {
            try {
                const res = await fetch("/api/batches", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load batches");
                const raw: unknown = await res.json();

                // Narrow unknown -> BatchApiRow[]
                const arr = Array.isArray(raw) ? (raw as BatchApiRow[]) : [];
                const names = arr
                    .map((item) => (typeof item === "string" ? item : item?.name ?? ""))
                    .filter((s): s is string => typeof s === "string" && s.length > 0);

                setBatches(names);
            } catch {
                setBatches([]);
            } finally {
                setLoadingBatches(false);
            }
        }
        void loadBatches();
    }, []);

    // Load attendance records
    async function load() {
        setLoading(true);
        try {
            const params = new URLSearchParams({ date, status: kind });
            if (batch) params.append("q", batch);

            const res = await fetch(`/api/attendance?${params.toString()}`, { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch attendance");

            const list = (await res.json()) as Array<AttendanceDoc & { _id: string }>;
            setRows(list);
        } catch {
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, kind, batch]);

    // Toggle Present ↔ Absent
    async function toggle(row: AttendanceDoc & { _id: string }) {
        const next: "Present" | "Absent" = kind === "Present" ? "Absent" : "Present";
        await fetch("/api/attendance", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                date,
                studentId: row.studentId,
                studentName: row.studentName,
                batch: row.batch,
                status: next,
            }),
        });
        await load();
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <h2 className="text-lg font-semibold">{title}</h2>

                    <div className="flex flex-wrap items-center gap-5">
                        {/* ✅ Batch Filter */}
                        <div className="flex gap-3 items-center">
                            <label className="block text-sm mb-1">Batch</label>
                            {loadingBatches ? (
                                <div className="skeleton h-10 w-32" />
                            ) : (
                                <select
                                    className="select select-bordered select-sm min-w-[130px] px-4 rounded-full"
                                    value={batch}
                                    onChange={(e) => setBatch(e.target.value)}
                                >
                                    <option value="">All Batches</option>
                                    {batches.map((b) => (
                                        <option key={b} value={b}>
                                            {b}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* ✅ Date Filter */}
                        <div className="flex gap-3 items-center">
                            <label className="block text-sm mb-1">Date</label>
                            <input
                                className="input input-bordered input-sm"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto mt-4">
                    <table className="table table-zebra">
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Batch</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center opacity-60">
                                        Loading...
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                rows.map((r) => (
                                    <tr key={r._id}>
                                        <td>
                                            {kind === "Present" ? (
                                                <button
                                                    className="btn btn-xs btn-error text-white"
                                                    title="Mark Absent"
                                                    onClick={() => toggle(r)}
                                                >
                                                    <IconX size={14} />
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-xs btn-success text-white"
                                                    title="Mark Present"
                                                    onClick={() => toggle(r)}
                                                >
                                                    <IconChecks size={14} />
                                                </button>
                                            )}
                                        </td>
                                        <td className="font-mono">{r.studentId}</td>
                                        <td>{r.studentName}</td>
                                        <td>{r.batch}</td>
                                    </tr>
                                ))}

                            {!loading && !rows.length && (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center opacity-60">
                                        No records found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
