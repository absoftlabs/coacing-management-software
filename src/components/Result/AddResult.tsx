// src/components/Result/AddResult.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Batch = { _id: string; name: string };
type StudentItem = { _id: string; studentId: string; name: string; batch: string };
type ClassItem = { _id: string; name: string; batch?: string };

const DEFAULT_TYPES = ["Class Test", "Weekly Test", "Quiz Test", "Model Test"] as const;

export default function AddResult() {
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    const [batches, setBatches] = useState<Batch[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [students, setStudents] = useState<StudentItem[]>([]);

    const [selectedBatch, setSelectedBatch] = useState("");
    const [studentList, setStudentList] = useState<StudentItem[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [selectedClassName, setSelectedClassName] = useState("");
    const [examDate, setExamDate] = useState<string>("");

    const [typeMode, setTypeMode] = useState<string>(DEFAULT_TYPES[0]);
    const [customType, setCustomType] = useState<string>("");

    const [mcqTotal, setMcqTotal] = useState<string>("");
    const [mcqGain, setMcqGain] = useState<string>("");
    const [quesTotal, setQuesTotal] = useState<string>("");
    const [quesGain, setQuesGain] = useState<string>("");

    // load batches & classes
    useEffect(() => {
        (async () => {
            try {
                const [bRes, cRes] = await Promise.all([fetch("/api/batches"), fetch("/api/classes")]);
                const bData = await bRes.json();
                const cData = await cRes.json();
                setBatches(bData);
                setClasses(cData);
            } catch { }
        })();
    }, []);

    // load students when batch changes
    useEffect(() => {
        (async () => {
            if (!selectedBatch) {
                setStudentList([]);
                setSelectedStudentId("");
                return;
            }
            try {
                const res = await fetch(`/api/students?batch=${encodeURIComponent(selectedBatch)}&suspended=false`);
                const data: StudentItem[] = await res.json();
                setStudentList(data);
            } catch {
                setStudentList([]);
            }
        })();
    }, [selectedBatch]);

    const classOptions = useMemo(() => {
        // optionally filter by batch if class has batch field
        const list = selectedBatch ? classes.filter(c => !c.batch || c.batch === selectedBatch) : classes;
        return list;
    }, [classes, selectedBatch]);

    const totalMarks = useMemo(() => (Number(mcqTotal || 0) + Number(quesTotal || 0)) || 0, [mcqTotal, quesTotal]);
    const totalGain = useMemo(() => (Number(mcqGain || 0) + Number(quesGain || 0)) || 0, [mcqGain, quesGain]);

    // GPA calc (on the fly)
    function getGpa(percent: number) {
        if (percent >= 80 && percent <= 100) return { grade: "A+", point: 5.0 };
        if (percent >= 70) return { grade: "A", point: 4.0 };
        if (percent >= 60) return { grade: "A-", point: 3.5 };
        if (percent >= 50) return { grade: "B", point: 3.0 };
        if (percent >= 40) return { grade: "C", point: 2.0 };
        if (percent >= 33) return { grade: "D", point: 1.0 };
        return { grade: "F", point: 0.0 };
    }
    const gpaView = useMemo(() => {
        if (!totalMarks || totalMarks <= 0) return "-";
        const percent = (totalGain * 100) / totalMarks;
        const { grade, point } = getGpa(percent);
        return `${grade} [${point.toFixed(2)}]`;
    }, [totalGain, totalMarks]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            const stu = studentList.find(s => s.studentId === selectedStudentId);
            if (!selectedBatch || !stu || !selectedClassName || !(typeMode || customType)) {
                setMessage("❌ Batch, Student, Class, Result Type প্রয়োজন");
                setSaving(false);
                return;
            }

            const payload = {
                batch: selectedBatch,
                studentId: stu.studentId,
                studentName: stu.name,
                className: selectedClassName,
                resultType: typeMode === "Custom" ? (customType.trim() || "Custom") : typeMode,
                examDate: examDate || undefined,
                mcqTotal: Number(mcqTotal || 0),
                mcqGain: Number(mcqGain || 0),
                quesTotal: Number(quesTotal || 0),
                quesGain: Number(quesGain || 0),
            };

            const res = await fetch("/api/results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setMessage("✅ Result added");
                // reset some fields
                setMcqTotal(""); setMcqGain(""); setQuesTotal(""); setQuesGain("");
            } else {
                const j = await res.json().catch(() => ({}));
                setMessage("❌ " + (j.error || "Failed to add"));
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Add Result</h1>

            <form onSubmit={onSubmit} className="card bg-base-100 shadow-xl">
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Batch */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Batch</label>
                        <select className="select select-bordered w-full" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                            <option value="">-- Select Batch --</option>
                            {batches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>

                    {/* Student (filtered by batch) */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Student</label>
                        <select className="select select-bordered w-full" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
                            <option value="">-- Select Student --</option>
                            {studentList.map(s => (
                                <option key={s._id} value={s.studentId}>{s.name} — {s.studentId}</option>
                            ))}
                        </select>
                    </div>

                    {/* Result Type */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Result Type</label>
                        <select className="select select-bordered w-full" value={typeMode} onChange={e => setTypeMode(e.target.value)}>
                            {([...DEFAULT_TYPES, "Custom"] as string[]).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Custom Result Type */}
                    {typeMode === "Custom" && (
                        <div className="form-control">
                            <label className="mb-1 block text-sm font-medium">Custom Result Type</label>
                            <input className="input input-bordered w-full" value={customType} onChange={e => setCustomType(e.target.value)} placeholder="e.g. Surprise Test" />
                        </div>
                    )}

                    {/* Class/Subject */}
                    <div className="form-control md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">Class/Subject</label>
                        <select className="select select-bordered w-full" value={selectedClassName} onChange={e => setSelectedClassName(e.target.value)}>
                            <option value="">-- Select Class/Subject --</option>
                            {classOptions.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Exam Date */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Exam Date</label>
                        <input type="date" className="input input-bordered w-full" value={examDate} onChange={e => setExamDate(e.target.value)} />
                    </div>

                    {/* Marks — MCQ */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Total Marks (MCQ)</label>
                        <input className="input input-bordered w-full" value={mcqTotal} onChange={e => setMcqTotal(e.target.value)} placeholder="e.g. 25" />
                    </div>
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Gain Marks (MCQ)</label>
                        <input className="input input-bordered w-full" value={mcqGain} onChange={e => setMcqGain(e.target.value)} placeholder="e.g. 22" />
                    </div>

                    {/* Marks — Question */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Total Marks (Question)</label>
                        <input className="input input-bordered w-full" value={quesTotal} onChange={e => setQuesTotal(e.target.value)} placeholder="e.g. 50" />
                    </div>
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Gain Marks (Question)</label>
                        <input className="input input-bordered w-full" value={quesGain} onChange={e => setQuesGain(e.target.value)} placeholder="e.g. 44" />
                    </div>

                    {/* Derived */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Total Marks (MCQ + Question)</label>
                        <input className="input input-bordered w-full" value={totalMarks} readOnly />
                    </div>
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Total Gain Marks</label>
                        <input className="input input-bordered w-full" value={totalGain} readOnly />
                    </div>

                    <div className="form-control md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">GPA (preview)</label>
                        <input className="input input-bordered w-full" value={gpaView} readOnly />
                    </div>

                    {/* actions */}
                    <div className="md:col-span-2 flex justify-end gap-2">
                        <a href="/result-list" className="btn btn-ghost">Cancel</a>
                        <button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Result"}</button>
                    </div>

                    {message && <div className="md:col-span-2 text-sm">{message}</div>}
                </div>
            </form>
        </div>
    );
}
