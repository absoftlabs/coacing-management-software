"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResultType } from "@/lib/types";

type Batch = { _id: string; name: string };
type Student = { _id: string; studentId: string; name: string; batch: string };
type ClassItem = { _id: string; name: string; batch?: string };

type SubjectRow = {
    className: string;
    mcqTotal: number;
    mcqGain: number;
    quesTotal: number;
    quesGain: number;
};

const RESULT_TYPES: ResultType[] = ["Class Test", "Weekly Test", "Quiz Test", "Model Test", "Custom"];

export default function AddResult() {
    const router = useRouter();
    const [msg, setMsg] = useState("");
    const [saving, setSaving] = useState(false);

    const [batches, setBatches] = useState<Batch[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [allClasses, setAllClasses] = useState<ClassItem[]>([]);

    const [selectedBatch, setSelectedBatch] = useState<string>("");
    const [selectedStudent, setSelectedStudent] = useState<string>("");
    const [resultType, setResultType] = useState<ResultType | "">("");
    const [examDate, setExamDate] = useState<string>("");

    const [subjects, setSubjects] = useState<SubjectRow[]>([
        { className: "", mcqTotal: 0, mcqGain: 0, quesTotal: 0, quesGain: 0 },
    ]);

    // initial loads
    useEffect(() => {
        (async () => {
            try {
                const [bRes, cRes] = await Promise.all([fetch("/api/batches"), fetch("/api/classes")]);
                if (bRes.ok) setBatches(await bRes.json());
                if (cRes.ok) setAllClasses(await cRes.json());
            } catch {
                // ignore
            }
        })();
    }, []);

    // students by batch
    useEffect(() => {
        if (!selectedBatch) {
            setStudents([]);
            return;
        }
        (async () => {
            try {
                const res = await fetch(`/api/students?batch=${encodeURIComponent(selectedBatch)}`);
                if (res.ok) setStudents(await res.json());
            } catch {
                setStudents([]);
            }
        })();
    }, [selectedBatch]);

    // try server-side class filter
    useEffect(() => {
        if (!selectedBatch) return;
        (async () => {
            try {
                const res = await fetch(`/api/classes?batch=${encodeURIComponent(selectedBatch)}`);
                if (res.ok) {
                    const cls: ClassItem[] = await res.json();
                    if (cls.length) setAllClasses(cls);
                }
            } catch {
                // ignore
            }
        })();
    }, [selectedBatch]);

    // filtered classes by batch (client safety)
    const filteredClasses = useMemo(() => {
        if (!selectedBatch) return [];
        const list = allClasses.filter((c) => !c.batch || c.batch === selectedBatch);
        return list.length ? list : allClasses;
    }, [allClasses, selectedBatch]);

    // if only one class in batch, force single subject & prefill
    useEffect(() => {
        if (!selectedBatch) return;
        if (filteredClasses.length === 1) {
            const onlyClass = filteredClasses[0];
            setSubjects([{ className: onlyClass?.name ?? "", mcqTotal: 0, mcqGain: 0, quesTotal: 0, quesGain: 0 }]);
        } else if (filteredClasses.length > 1) {
            setSubjects((prev) =>
                prev.map((s) => ({
                    ...s,
                    className: filteredClasses.some((c) => c.name === s.className) ? s.className : "",
                }))
            );
        } else {
            setSubjects([{ className: "", mcqTotal: 0, mcqGain: 0, quesTotal: 0, quesGain: 0 }]);
        }
    }, [selectedBatch, filteredClasses]);

    const canAddMoreSubjects = filteredClasses.length > 1;

    function addSubject() {
        setSubjects((prev) => [...prev, { className: "", mcqTotal: 0, mcqGain: 0, quesTotal: 0, quesGain: 0 }]);
    }
    function removeSubject(index: number) {
        setSubjects((prev) => prev.filter((_, i) => i !== index));
    }
    function updateSubject<K extends keyof SubjectRow>(i: number, field: K, value: SubjectRow[K]) {
        setSubjects((prev) => {
            const copy = [...prev];
            copy[i] = { ...copy[i], [field]: value };
            return copy;
        });
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMsg("");
        setSaving(true);

        if (!selectedBatch) { setMsg("❌ Select batch"); setSaving(false); return; }
        if (!selectedStudent) { setMsg("❌ Select student"); setSaving(false); return; }
        if (!resultType) { setMsg("❌ Select result type"); setSaving(false); return; }

        const student = students.find((s) => s._id === selectedStudent);
        if (!student) { setMsg("❌ Invalid student"); setSaving(false); return; }

        // validate subjects
        const invalid = subjects.find(
            (s) =>
                !s.className ||
                !Number.isFinite(Number(s.mcqTotal)) ||
                !Number.isFinite(Number(s.mcqGain)) ||
                !Number.isFinite(Number(s.quesTotal)) ||
                !Number.isFinite(Number(s.quesGain))
        );
        if (invalid) { setMsg("❌ Please fill subject rows correctly"); setSaving(false); return; }

        const payload = {
            batch: selectedBatch,
            studentId: student.studentId,
            studentName: student.name,
            resultType: resultType as ResultType,
            examDate: examDate || new Date().toISOString(),
            subjects: subjects.map((s) => ({
                className: s.className,
                mcqTotal: Number(s.mcqTotal) || 0,
                mcqGain: Number(s.mcqGain) || 0,
                quesTotal: Number(s.quesTotal) || 0,
                quesGain: Number(s.quesGain) || 0,
            })),
        };

        const res = await fetch("/api/results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            router.push("/result-list");
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({ error: "" } as { error?: string }));
            setMsg("❌ " + (j.error || "Failed to save"));
            setSaving(false);
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Add Result (Multi-Subject)</h1>

            <form className="card bg-base-100 shadow-xl" onSubmit={onSubmit}>
                <div className="card-body space-y-4">

                    {/* Top row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="form-control">
                            <label className="mb-1 block text-sm font-medium">Batch</label>
                            <select className="select select-bordered w-full" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                                <option value="">-- Select Batch --</option>
                                {batches.map((b) => <option key={b._id} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="mb-1 block text-sm font-medium">Student</label>
                            <select className="select select-bordered w-full" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} disabled={!selectedBatch}>
                                <option value="">-- Select Student --</option>
                                {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="mb-1 block text-sm font-medium">Result Type</label>
                            <select className="select select-bordered w-full" value={resultType} onChange={(e) => setResultType(e.target.value as ResultType | "")}>
                                <option value="">-- Select --</option>
                                {RESULT_TYPES.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="mb-1 block text-sm font-medium">Exam Date</label>
                            <input type="date" className="input input-bordered w-full" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                        </div>
                    </div>

                    <hr className="my-2" />

                    {/* Subject Rows */}
                    {subjects.map((sub, idx) => (
                        <div key={idx} className="border border-base-300 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold">Subject #{idx + 1}</h3>
                                <div className="flex gap-2">
                                    {filteredClasses.length > 1 && (
                                        <button type="button" onClick={addSubject} className="btn btn-xs btn-success" title="Add">➕</button>
                                    )}
                                    {subjects.length > 1 && (
                                        <button type="button" onClick={() => removeSubject(idx)} className="btn btn-xs btn-error" title="Remove">➖</button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div className="form-control">
                                    <label className="mb-1 block text-sm">Class / Subject</label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={sub.className}
                                        onChange={(e) => updateSubject(idx, "className", e.target.value)}
                                        disabled={!selectedBatch || filteredClasses.length === 0}
                                    >
                                        <option value="">{selectedBatch ? "-- Select --" : "Select batch first"}</option>
                                        {filteredClasses.map((c) => (
                                            <option key={c._id ?? c.name} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="mb-1 block text-sm">MCQ Total</label>
                                    <input type="number" className="input input-bordered w-full" value={sub.mcqTotal} onChange={(e) => updateSubject(idx, "mcqTotal", Number(e.target.value))} />
                                </div>
                                <div className="form-control">
                                    <label className="mb-1 block text-sm">MCQ Gain</label>
                                    <input type="number" className="input input-bordered w-full" value={sub.mcqGain} onChange={(e) => updateSubject(idx, "mcqGain", Number(e.target.value))} />
                                </div>
                                <div className="form-control">
                                    <label className="mb-1 block text-sm">Question Total</label>
                                    <input type="number" className="input input-bordered w-full" value={sub.quesTotal} onChange={(e) => updateSubject(idx, "quesTotal", Number(e.target.value))} />
                                </div>
                                <div className="form-control">
                                    <label className="mb-1 block text-sm">Question Gain</label>
                                    <input type="number" className="input input-bordered w-full" value={sub.quesGain} onChange={(e) => updateSubject(idx, "quesGain", Number(e.target.value))} />
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-end gap-2">
                        <a href="/result-list" className="btn btn-ghost">Cancel</a>
                        <button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Result"}</button>
                    </div>

                    {msg && <div className="text-sm">{msg}</div>}
                </div>
            </form>
        </div>
    );
}
