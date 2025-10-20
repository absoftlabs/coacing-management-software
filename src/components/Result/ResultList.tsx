"use client";

import { useMemo, useRef, useState } from "react";

export type ResultRow = {
    _id: string;
    batch: string;
    studentId: string;
    studentName: string;
    className: string;
    resultType: string;
    examDate?: string;
    mcqTotal?: number;
    mcqGain?: number;
    quesTotal?: number;
    quesGain?: number;
    totalMarks?: number;
    totalGain?: number;
};

export default function ResultList({
    rows,
    batches,
    classes,
}: {
    rows: ResultRow[];
    batches: string[];
    classes: string[];
}) {
    const [data, setData] = useState<ResultRow[]>(rows);

    const [q, setQ] = useState("");
    const [batch, setBatch] = useState("");
    const [className, setClassName] = useState("");

    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const [view, setView] = useState<ResultRow | null>(null);

    function getGpa(percent: number) {
        if (percent >= 80 && percent <= 100) return { grade: "A+", point: 5.0 };
        if (percent >= 70) return { grade: "A", point: 4.0 };
        if (percent >= 60) return { grade: "A-", point: 3.5 };
        if (percent >= 50) return { grade: "B", point: 3.0 };
        if (percent >= 40) return { grade: "C", point: 2.0 };
        if (percent >= 33) return { grade: "D", point: 1.0 };
        return { grade: "F", point: 0.0 };
    }

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return data.filter(r => {
            const okQ = !s ||
                r.studentId.toLowerCase().includes(s) ||
                r.studentName.toLowerCase().includes(s);
            const okB = !batch || r.batch === batch;
            const okC = !className || r.className === className;
            return okQ && okB && okC;
        });
    }, [q, batch, className, data]);

    async function onDelete(id: string) {
        if (!confirm("Delete this result?")) return;
        const res = await fetch(`/api/results/${id}`, { method: "DELETE" });
        if (res.ok) setData(prev => prev.filter(x => x._id !== id));
        else alert("Delete failed");
    }

    function openView(item: ResultRow) {
        setView(item);
        dialogRef.current?.showModal();
    }
    function closeView() {
        dialogRef.current?.close();
        setView(null);
    }

    function printView() {
        if (!view) return;
        const total = view.totalMarks ?? ((view.mcqTotal ?? 0) + (view.quesTotal ?? 0));
        const gain = view.totalGain ?? ((view.mcqGain ?? 0) + (view.quesGain ?? 0));
        const percent = total > 0 ? (gain * 100) / total : 0;
        const { grade, point } = getGpa(percent);

        const styles = `
      <style>
        body { font-family: ui-sans-serif, system-ui; padding: 24px; }
        .card { border:1px solid #e5e7eb; border-radius:12px; padding:20px; }
        .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
        .title { font-size:20px; font-weight:700; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px 24px; }
        .row { display:flex; gap:8px; }
        .label { width:200px; color:#6b7280; }
        .val { font-weight:500; }
      </style>
    `;

        const html = `
      <html>
        <head><title>Marksheet - ${view.studentName}</title>${styles}</head>
        <body onload="window.print();window.close()">
          <div class="card">
            <div class="header">
              <div class="title">Marksheet</div>
              <div class="mono">${view.studentId}</div>
            </div>
            <div class="grid">
              <div class="row"><div class="label">Student</div><div class="val">${view.studentName}</div></div>
              <div class="row"><div class="label">Batch</div><div class="val">${view.batch}</div></div>
              <div class="row"><div class="label">Class/Subject</div><div class="val">${view.className}</div></div>
              <div class="row"><div class="label">Result Type</div><div class="val">${view.resultType}</div></div>
              <div class="row"><div class="label">Exam Date</div><div class="val">${view.examDate || "-"}</div></div>

              <div class="row"><div class="label">MCQ</div><div class="val">${view.mcqGain ?? 0} / ${view.mcqTotal ?? 0}</div></div>
              <div class="row"><div class="label">Question</div><div class="val">${view.quesGain ?? 0} / ${view.quesTotal ?? 0}</div></div>
              <div class="row"><div class="label">Total</div><div class="val">${gain} / ${total}</div></div>
              <div class="row"><div class="label">GPA</div><div class="val">${grade} [${point.toFixed(2)}]</div></div>
            </div>
          </div>
        </body>
      </html>
    `;

        const win = window.open("", "PRINT", "height=650,width=900,top=100,left=150");
        if (!win) return;
        win.document.write(html);
        win.document.close();
    }

    return (
        <>
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="flex flex-col lg:flex-row gap-3 items-end justify-between">
                        <div className="flex flex-wrap gap-3">
                            <input className="input input-bordered" placeholder="Search by Student ID / Name" value={q} onChange={e => setQ(e.target.value)} />
                            <select className="select select-bordered" value={batch} onChange={e => setBatch(e.target.value)}>
                                <option value="">All Batches</option>
                                {batches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <select className="select select-bordered" value={className} onChange={e => setClassName(e.target.value)}>
                                <option value="">All Classes</option>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <a href="/add-result" className="btn btn-primary">Add Result</a>
                    </div>

                    <div className="overflow-x-auto mt-4">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>SL</th>
                                    <th>Student</th>
                                    <th>Student ID</th>
                                    <th>Batch</th>
                                    <th>Class</th>
                                    <th>Exam Type</th>
                                    <th>Date</th>
                                    <th>MCQ (Gain/Total)</th>
                                    <th>Question (Gain/Total)</th>
                                    <th>Total Gain</th>
                                    <th>GPA</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r, i) => {
                                    const total = r.totalMarks ?? ((r.mcqTotal ?? 0) + (r.quesTotal ?? 0));
                                    const gain = r.totalGain ?? ((r.mcqGain ?? 0) + (r.quesGain ?? 0));
                                    const percent = total > 0 ? (gain * 100) / total : 0;
                                    const { grade, point } = getGpa(percent);
                                    return (
                                        <tr key={r._id}>
                                            <td>{i + 1}</td>
                                            <td>{r.studentName}</td>
                                            <td className="font-mono">{r.studentId}</td>
                                            <td>{r.batch}</td>
                                            <td>{r.className}</td>
                                            <td>{r.resultType}</td>
                                            <td>{r.examDate || "-"}</td>
                                            <td>{(r.mcqGain ?? 0)} / {(r.mcqTotal ?? 0)}</td>
                                            <td>{(r.quesGain ?? 0)} / {(r.quesTotal ?? 0)}</td>
                                            <td>{gain}</td>
                                            <td>{grade} [{point.toFixed(2)}]</td>
                                            <td className="text-right">
                                                <div className="join">
                                                    <button className="btn btn-sm join-item" onClick={() => openView(r)}>View</button>
                                                    <a className="btn btn-sm join-item" href={`/edit-result/${r._id}`}>Edit</a>
                                                    <button className="btn btn-sm btn-outline join-item" onClick={() => onDelete(r._id)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!filtered.length && (
                                    <tr>
                                        <td colSpan={12} className="text-center opacity-60 py-10">No results</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* View / Marksheet Modal */}
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box max-w-3xl">
                    <h3 className="font-bold text-lg">Marksheet</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <Field label="Student" value={view?.studentName} />
                        <Field label="Student ID" value={view?.studentId} mono />
                        <Field label="Batch" value={view?.batch} />
                        <Field label="Class" value={view?.className} />
                        <Field label="Result Type" value={view?.resultType} />
                        <Field label="Exam Date" value={view?.examDate || "-"} />
                        <Field label="MCQ (Gain/Total)" value={`${view?.mcqGain ?? 0} / ${view?.mcqTotal ?? 0}`} />
                        <Field label="Question (Gain/Total)" value={`${view?.quesGain ?? 0} / ${view?.quesTotal ?? 0}`} />
                        <Field label="Total" value={`${(view?.totalGain ?? 0)} / ${(view?.totalMarks ?? 0)}`} />
                        {(() => {
                            if (!view) return null;
                            const total = view.totalMarks ?? ((view.mcqTotal ?? 0) + (view.quesTotal ?? 0));
                            const gain = view.totalGain ?? ((view.mcqGain ?? 0) + (view.quesGain ?? 0));
                            const percent = total > 0 ? (gain * 100) / total : 0;
                            const { grade, point } = getGpa(percent);
                            return <Field label="GPA" value={`${grade} [${point.toFixed(2)}]`} />;
                        })()}
                    </div>

                    <div className="modal-action">
                        <button className="btn btn-ghost" onClick={closeView}>Close</button>
                        <button className="btn btn-primary" onClick={printView}>Print</button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
    return (
        <div className="flex gap-2">
            <div className="text-sm opacity-60 w-52">{label}</div>
            <div className={`font-medium ${mono ? "font-mono" : ""}`}>{value || "-"}</div>
        </div>
    );
}
