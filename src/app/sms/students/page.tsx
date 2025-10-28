// src/app/sms/students/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type BatchRow = { _id: string; name: string };
type TemplateRow = { _id: string; templateName: string; templateBody: string; createdAt: string; updatedAt: string };
type ResultRow = {
    _id: string;
    batch: string;
    studentId?: string;
    studentName?: string;
    resultType: string;
    examDate?: string;
    subjects: Array<{ className: string; mcqTotal?: number; mcqGain?: number; quesTotal?: number; quesGain?: number; totalMarks?: number; totalGain?: number }>;
    totalMarks?: number;
    totalGain?: number;
    createdAt: string;
    updatedAt: string;
};
type StudentRow = { _id: string; studentId: string; name: string; batch: string; guardianPhone?: string; roll?: string };

export default function StudentSmsPage() {
    const [batches, setBatches] = useState<BatchRow[]>([]);
    const [templates, setTemplates] = useState<TemplateRow[]>([]);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [results, setResults] = useState<ResultRow[]>([]);

    const [batch, setBatch] = useState<string>("");
    const [studentId, setStudentId] = useState<string>("");
    const [qStudent, setQStudent] = useState<string>("");
    const [templateId, setTemplateId] = useState<string>("");
    const [resultType, setResultType] = useState<string>("");
    const [resultId, setResultId] = useState<string>("");
    const [sending, setSending] = useState(false);
    const [msg, setMsg] = useState<string>("");

    useEffect(() => {
        (async () => {
            try {
                const [b, t] = await Promise.all([
                    fetch("/api/batches", { cache: "no-store" }).then(r => r.json() as Promise<BatchRow[]>),
                    fetch("/api/sms/templates", { cache: "no-store" }).then(r => r.json() as Promise<TemplateRow[]>),
                ]);
                setBatches(b);
                setTemplates(t);
            } catch {
                setBatches([]); setTemplates([]);
            }
        })();
    }, []);

    useEffect(() => {
        if (!batch) { setStudents([]); return; }
        (async () => {
            try {
                const url = qStudent ? `/api/students?q=${encodeURIComponent(qStudent)}&batch=${encodeURIComponent(batch)}` : `/api/students?batch=${encodeURIComponent(batch)}`;
                const st = await fetch(url, { cache: "no-store" }).then(r => r.json() as Promise<StudentRow[]>);
                setStudents(st);
            } catch {
                setStudents([]);
            }
        })();
    }, [batch, qStudent]);

    useEffect(() => {
        if (!batch || !resultType) { setResults([]); return; }
        (async () => {
            try {
                const url = new URL("/api/results", location.origin);
                url.searchParams.set("batch", batch);
                url.searchParams.set("resultType", resultType);
                if (studentId) url.searchParams.set("studentId", studentId);
                const data = await fetch(url.toString(), { cache: "no-store" }).then(r => r.json() as Promise<ResultRow[]>);
                setResults(data.slice(0, 20));
            } catch {
                setResults([]);
            }
        })();
    }, [batch, resultType, studentId]);

    const studentsInBatch = useMemo(() => students.filter(s => s.batch === batch), [students, batch]);

    async function send() {
        setSending(true);
        setMsg("");
        try {
            if (!batch || !templateId || !resultId) {
                setMsg("Select batch, template and result.");
                setSending(false);
                return;
            }
            const payload = {
                batchId: batch,
                studentId: studentId || undefined,
                templateId,
                resultId,
                coachingName: "Prottasha Coaching Center",
            };
            const res = await fetch("/api/sms/send/student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) setMsg("✅ Sent");
            else {
                const j = await res.json().catch(() => ({} as { error?: string }));
                setMsg("❌ " + (j.error ?? "Failed to send"));
            }
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body space-y-4">
                <h2 className="card-title">Send SMS to Students / Guardians</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Batch *</span></label>
                        <select className="select select-bordered" value={batch} onChange={(e) => { setBatch(e.target.value); setStudentId(""); setResultId(""); }}>
                            <option value="">-- Select Batch --</option>
                            {batches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label"><span className="label-text">SMS Template *</span></label>
                        <select className="select select-bordered" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                            <option value="">-- Select Template --</option>
                            {templates.map(t => <option key={t._id} value={t._id}>{t.templateName}</option>)}
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label"><span className="label-text">Student (Optional)</span></label>
                        <div className="join w-full">
                            <input className="input input-bordered join-item w-full" placeholder="Search by name or ID"
                                value={qStudent} onChange={(e) => setQStudent(e.target.value)} />
                            <select className="select select-bordered join-item"
                                value={studentId}
                                onChange={(e) => { setStudentId(e.target.value); setResultId(""); }}>
                                <option value="">All in Batch</option>
                                {studentsInBatch.map(s => (
                                    <option key={s._id} value={s.studentId}>
                                        {s.name} ({s.studentId})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <small className="opacity-60">Leave blank to send to all guardians in the selected batch.</small>
                    </div>

                    <div className="form-control">
                        <label className="label"><span className="label-text">Result Type *</span></label>
                        <select className="select select-bordered" value={resultType} onChange={(e) => { setResultType(e.target.value); setResultId(""); }}>
                            <option value="">-- Select --</option>
                            <option value="Class Test">Class Test</option>
                            <option value="Weekly Test">Weekly Test</option>
                            <option value="Quiz Test">Quiz Test</option>
                            <option value="Model Test">Model Test</option>
                            <option value="Custom">Custom</option>
                        </select>
                    </div>

                    <div className="form-control md:col-span-2">
                        <label className="label"><span className="label-text">Select Result *</span></label>
                        <select className="select select-bordered" value={resultId} onChange={(e) => setResultId(e.target.value)}>
                            <option value="">-- Select Result --</option>
                            {results.map(r => (
                                <option key={r._id} value={r._id}>
                                    {r.studentName ? `${r.studentName} – ` : ""}{r.resultType} – {r.examDate ?? "-"}
                                </option>
                            ))}
                        </select>
                        <small className="opacity-60">Shows recent results filtered by batch/student/type.</small>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button className="btn btn-primary" onClick={send} disabled={sending}>
                        {sending ? "Sending..." : "Send"}
                    </button>
                </div>

                {msg && <div className="text-sm">{msg}</div>}
            </div>
        </div>
    );
}
