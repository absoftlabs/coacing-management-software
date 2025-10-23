// src/components/Attendance/MarkAttendance.tsx
"use client";

import { IconChecks, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

type StudentRow = {
    _id: string;
    studentId: string;
    name: string;
    batch: string;
};

type Props = {
    batches: string[];
};

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

export default function MarkAttendance({ batches }: Props) {
    const [batch, setBatch] = useState<string>("");
    const [date, setDate] = useState<string>(today());
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
    const [absentIds, setAbsentIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!batch) {
            setStudents([]);
            setPresentIds(new Set());
            setAbsentIds(new Set());
            return;
        }

        (async () => {
            setLoading(true);
            try {
                // fetch students by batch
                const res = await fetch(`/api/students?batch=${encodeURIComponent(batch)}`, { cache: "no-store" });
                const list = (await res.json()) as Array<{
                    _id: string;
                    studentId: string;
                    name: string;
                    batch: string;
                }>;
                setStudents(list);

                // fetch current date attendance snapshot
                const attRes = await fetch(`/api/attendance?date=${date}`, { cache: "no-store" });
                const attList = (await attRes.json()) as Array<{ studentId: string; status: "Present" | "Absent" }>;

                const p = new Set<string>();
                const a = new Set<string>();
                for (const rec of attList) {
                    if (rec.status === "Present") p.add(rec.studentId);
                    if (rec.status === "Absent") a.add(rec.studentId);
                }
                setPresentIds(p);
                setAbsentIds(a);
            } catch {
                setStudents([]);
                setPresentIds(new Set());
                setAbsentIds(new Set());
            } finally {
                setLoading(false);
            }
        })();
    }, [batch, date]);

    async function mark(student: StudentRow, status: "Present" | "Absent") {
        await fetch("/api/attendance", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                date,
                studentId: student.studentId,
                studentName: student.name,
                batch: student.batch,
                status,
            }),
        });

        // optimistic update
        setPresentIds((prev) => {
            const next = new Set(prev);
            if (status === "Present") next.add(student.studentId);
            else next.delete(student.studentId);
            return next;
        });
        setAbsentIds((prev) => {
            const next = new Set(prev);
            if (status === "Absent") next.add(student.studentId);
            else next.delete(student.studentId);
            return next;
        });
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex flex-wrap gap-5 items-end">
                    <div>
                        <label className="block text-sm mb-1">Batch</label>
                        <select className="select select-bordered px-4 rounded-full" value={batch} onChange={(e) => setBatch(e.target.value)}>
                            <option className="ps-5" value="">-- Select Batch --</option>
                            {batches.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Date</label>
                        <input className="input input-bordered" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                </div>

                <div className="overflow-x-auto mt-4">
                    <table className="table table-zebra">
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Student ID</th>
                                <th>Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={3} className="py-10 text-center opacity-60">
                                        Loading...
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                students.map((s) => {
                                    const isP = presentIds.has(s.studentId);
                                    const isA = absentIds.has(s.studentId);
                                    return (
                                        <tr key={s._id}>
                                            <td>
                                                <div className="join">
                                                    <button
                                                        className={`btn btn-sm join-item ${isP ? "btn-success text-white" : ""}`}
                                                        title="Mark Present"
                                                        onClick={() => mark(s, "Present")}
                                                    >
                                                        <IconChecks />
                                                    </button>
                                                    <button
                                                        className={`btn btn-sm join-item ${isA ? "btn-error text-white" : ""}`}
                                                        title="Mark Absent"
                                                        onClick={() => mark(s, "Absent")}
                                                    >
                                                        <IconX />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="font-mono">{s.studentId}</td>
                                            <td>{s.name}</td>
                                        </tr>
                                    );
                                })}

                            {!loading && students.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="py-10 text-center opacity-60">
                                        No students
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
