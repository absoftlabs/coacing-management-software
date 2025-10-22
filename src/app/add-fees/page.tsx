"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Student = {
    _id: string;
    studentId: string;
    name: string;
    fatherName?: string;
    motherName?: string;
};

export default function AddFee() {
    const router = useRouter();

    // search state
    const [studentQuery, setStudentQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

    // selected student (always from DB)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // form fields
    const [amount, setAmount] = useState<string>("");
    const [depositBy, setDepositBy] = useState<string>("");
    const [receivedBy, setReceivedBy] = useState<string>("");

    // ui state
    const [msg, setMsg] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    const debounceRef = useRef<number | null>(null);

    // --- search students by ID or Name ---
    useEffect(() => {
        if (!studentQuery.trim()) {
            setSearchResults([]);
            return;
        }
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(async () => {
            setLoadingSearch(true);
            try {
                // server should return full docs including fatherName/motherName
                const res = await fetch(`/api/students?q=${encodeURIComponent(studentQuery)}`, {
                    cache: "no-store",
                });
                if (!res.ok) throw new Error("Failed to search");
                const data: Student[] = await res.json();
                setSearchResults(data.slice(0, 10));
            } catch {
                setSearchResults([]);
            } finally {
                setLoadingSearch(false);
            }
        }, 300);
    }, [studentQuery]);

    // build deposit options strictly from selectedStudent (DB-sourced)
    const depositOptions = useMemo(() => {
        if (!selectedStudent) return [];
        const opts: string[] = [];
        if (selectedStudent.name) opts.push(`${selectedStudent.name} (Student)`);
        if (selectedStudent.fatherName) opts.push(`${selectedStudent.fatherName} (Father)`);
        if (selectedStudent.motherName) opts.push(`${selectedStudent.motherName} (Mother)`);
        return opts;
    }, [selectedStudent]);

    // pick a student; then refetch the single student by id to ensure freshest data
    async function pickStudent(s: Student) {
        try {
            const res = await fetch(`/api/students/${s._id}`, { cache: "no-store" });
            const full: Student | { error?: string } = await res.json();
            if (!res.ok || (full as { error?: string }).error) {
                // fallback to the item from search list if single fetch fails
                setSelectedStudent(s);
            } else {
                const doc = full as Student;
                setSelectedStudent({
                    _id: doc._id,
                    studentId: doc.studentId,
                    name: doc.name,
                    fatherName: doc.fatherName,
                    motherName: doc.motherName,
                });
            }
            // fill the visible field, clear dropdown
            setStudentQuery(`${s.studentId} — ${s.name}`);
            setSearchResults([]);
            // default depositBy to student himself/herself
            setDepositBy(`${s.name} (Student)`);
        } catch {
            setSelectedStudent(s);
            setStudentQuery(`${s.studentId} — ${s.name}`);
            setSearchResults([]);
            setDepositBy(`${s.name} (Student)`);
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMsg("");

        if (!selectedStudent) {
            setMsg("❌ Please select a student first.");
            return;
        }
        const amt = Number(amount);
        if (!amt || amt <= 0) {
            setMsg("❌ Enter a valid amount.");
            return;
        }
        if (!depositBy.trim() || !receivedBy.trim()) {
            setMsg("❌ All fields are required.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                studentId: selectedStudent.studentId,
                studentName: selectedStudent.name,
                amount: amt,
                depositBy,
                receivedBy,
            };
            const res = await fetch("/api/fees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const j = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(j.error || "Failed to save fee");
            }
            router.push("/fees-list");
            router.refresh();
        } catch (err) {
            setMsg("❌ " + (err as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Collect Student Fee</h1>

            <form onSubmit={onSubmit} className="card bg-base-100 shadow-xl">
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Student (search) */}
                    <div className="form-control md:col-span-1 relative">
                        <label className="label">
                            <span className="label-text font-medium">Student (Search by ID or Name)</span>
                        </label>
                        <input
                            className="input input-bordered w-full"
                            placeholder="Type student ID or name…"
                            value={studentQuery}
                            onChange={(e) => {
                                setStudentQuery(e.target.value);
                                setSelectedStudent(null);
                                setDepositBy("");
                            }}
                            autoComplete="off"
                        />
                        {loadingSearch && (
                            <div className="absolute right-3 top-3 text-sm opacity-70">⏳</div>
                        )}
                        {searchResults.length > 0 && !selectedStudent && (
                            <ul className="absolute z-20 bg-base-100 w-full border rounded-box mt-1 shadow-lg max-h-60 overflow-auto">
                                {searchResults.map((s) => (
                                    <li
                                        key={s._id}
                                        className="px-3 py-2 hover:bg-base-200 cursor-pointer"
                                        onClick={() => pickStudent(s)}
                                    >
                                        <div className="font-semibold">{s.name}</div>
                                        <div className="text-xs opacity-70">
                                            ID: {s.studentId}
                                            {s.fatherName ? ` • Father: ${s.fatherName}` : ""}
                                            {s.motherName ? ` • Mother: ${s.motherName}` : ""}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {selectedStudent && (
                            <p className="text-xs opacity-70 mt-1">
                                ✅ Selected: <b>{selectedStudent.name}</b> ({selectedStudent.studentId})
                            </p>
                        )}
                    </div>

                    {/* Amount */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Amount (৳)</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="input input-bordered"
                            placeholder="Enter amount"
                            required
                        />
                    </div>

                    {/* Deposit By (student + father + mother from DB) */}
                    <div className="form-control md:col-span-1 w-full">
                        <label className="label">
                            <span className="label-text font-medium">Deposit By</span>
                        </label>
                        {selectedStudent ? (
                            <select
                                className="select select-bordered"
                                value={depositBy}
                                onChange={(e) => setDepositBy(e.target.value)}
                                required
                            >
                                <option value="">-- Select --</option>
                                {depositOptions.map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="input input-bordered opacity-60 text-sm flex items-center">
                                Select a student first
                            </div>
                        )}
                    </div>

                    {/* Received By */}
                    <div className="form-control md:col-span-1">
                        <label className="label">
                            <span className="label-text font-medium">Received By</span>
                        </label>
                        <input
                            className="input input-bordered"
                            placeholder="e.g. Accounts / Admin"
                            value={receivedBy}
                            onChange={(e) => setReceivedBy(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="card-actions justify-end p-6 pt-0">
                    <a href="/fees-list" className="btn btn-ghost">
                        Cancel
                    </a>
                    <button disabled={submitting} className="btn btn-primary">
                        {submitting ? "Saving..." : "Save Fee"}
                    </button>
                </div>

                {msg && <div className="px-6 pb-6 text-sm text-error">{msg}</div>}
            </form>
        </div>
    );
}
