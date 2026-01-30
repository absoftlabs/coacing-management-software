"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ResultDoc } from "@/lib/types";

type Props = {
    rows: ResultDoc[];
    batches: string[];
    classes: string[];
};

export default function ResultList({ rows, batches, classes }: Props) {
    const [data, setData] = useState<ResultDoc[]>(rows);
    const [q, setQ] = useState<string>("");
    const [batch, setBatch] = useState<string>("");
    const [className, setClassName] = useState<string>("");
    const [templates, setTemplates] = useState<Array<{ _id: string; templateName: string }>>([]);
    const [templateId, setTemplateId] = useState<string>("");
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [smsMsg, setSmsMsg] = useState<string>("");

    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const [view, setView] = useState<ResultDoc | null>(null);

    function getGpa(percent: number) {
        if (percent >= 80) return { grade: "A+", point: 5.0 };
        if (percent >= 70) return { grade: "A", point: 4.0 };
        if (percent >= 60) return { grade: "A-", point: 3.5 };
        if (percent >= 50) return { grade: "B", point: 3.0 };
        if (percent >= 40) return { grade: "C", point: 2.0 };
        if (percent >= 33) return { grade: "D", point: 1.0 };
        return { grade: "F", point: 0.0 };
    }

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return data.filter((r) => {
            const studentId = (r.studentId ?? "").toLowerCase();
            const studentName = (r.studentName ?? "").toLowerCase();
            const batchVal = r.batch ?? "";
            const classList = r.subjects ?? [];

            const okQ = !s || studentId.includes(s) || studentName.includes(s);
            const okB = !batch || batchVal === batch;
            const okC = !className || classList.some((sub) => sub.className === className);

            return okQ && okB && okC;
        });
    }, [q, batch, className, data]);

    async function onDelete(id: string) {
        if (!confirm("Delete this result?")) return;
        const res = await fetch(`/api/results/${id}`, { method: "DELETE" });
        if (res.ok) setData((prev) => prev.filter((x) => x._id !== id));
        else alert("Delete failed");
    }

    function openView(item: ResultDoc) {
        setView(item);
        dialogRef.current?.showModal();
    }
    function closeView() {
        dialogRef.current?.close();
        setView(null);
    }

    async function loadTemplates() {
        try {
            const res = await fetch("/api/sms/templates", { cache: "no-store" });
            if (!res.ok) return;
            const list = (await res.json()) as Array<{ _id: string; templateName: string }>;
            setTemplates(list);
            if (list.length && !templateId) setTemplateId(list[0]._id);
        } catch {
            // ignore
        }
    }
    
    // auto-load templates once so SMS button isn't muted
    useEffect(() => {
        loadTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function sendSms(r: ResultDoc) {
        if (!templateId) {
            setSmsMsg("❌ Please select an SMS template first.");
            return;
        }
        if (!r._id) return;
        setSmsMsg("");
        setSendingId(r._id);
        try {
            const res = await fetch("/api/sms/send/student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batchId: r.batch,
                    studentId: r.studentId,
                    templateId,
                    resultId: r._id,
                    coachingName: "Prottasha Coaching Center",
                }),
            });
            if (res.ok) {
                setSmsMsg("✅ SMS sent");
            } else {
                const j = (await res.json().catch(() => ({}))) as { error?: string };
                setSmsMsg("❌ " + (j.error ?? "SMS failed"));
            }
        } finally {
            setSendingId(null);
        }
    }

    // --- inside ResultList component ---
    async function printView() {
        if (!view) return;

        // 1) Pull student (to get photoUrl)
        type StudentLite = {
            _id: string;
            studentId: string;
            name?: string;
            photoUrl?: string;
        };

        let student: StudentLite | null = null;
        try {
            const res = await fetch(`/api/students?q=${encodeURIComponent(view.studentId)}`, { cache: "no-store" });
            if (res.ok) {
                const list: StudentLite[] = await res.json();
                student = list.find(x => x.studentId === view.studentId) ?? null;
            }
        } catch {
            // ignore fetch errors; we'll fall back to placeholder
        }

        // 2) Build a safe absolute URL for the image (works in the new print window)
        const placeholder = "https://via.placeholder.com/120x120.png?text=No+Photo";
        const raw = student?.photoUrl?.trim();
        const absolute = (() => {
            if (!raw) return placeholder;
            if (raw.startsWith("data:")) return raw;               // data URL is already absolute
            if (/^https?:\/\//i.test(raw)) return raw;             // remote URL
            // relative path -> make it absolute to current origin so the new window can load it
            try { return new URL(raw, window.location.origin).toString(); } catch { return placeholder; }
        })();

        // 3) Rest of the calculations
        const total = view.totalMarks ?? view.subjects.reduce((acc, s) => acc + (s.totalMarks ?? 0), 0);
        const gain = view.totalGain ?? view.subjects.reduce((acc, s) => acc + (s.totalGain ?? 0), 0);
        const percent = total > 0 ? (gain * 100) / total : 0;
        const { grade, point } = getGpa(percent);

        const ORG_NAME = "Prottasha Coaching Center";
        const ORG_PLACE = "Cheradanghi Mor, Auliapur, Sadar, Dinajpur";
        const ORG_PHONE = "01798930232";
        const ORG_LOGO = "https://i.ibb.co.com/cXwWBJCC/logo2.png";

        const styles = `
    <style>
      body { font-family: ui-sans-serif, system-ui; padding: 28px; color:#111; }
      .sheet { max-width: 900px; margin: auto; border:1px solid #d1d5db; border-radius:12px; padding: 28px 36px; background:#fff; }
      .header { display:flex; align-items:center; gap:16px; border-bottom:2px solid #111; padding-bottom:12px; margin-bottom:16px; }
      .logo { width:80px; height:80px; border-radius:12px; object-fit:cover; border:1px solid #e5e7eb; }
      .org { flex:1; text-align:center; }
      .org-name { font-size:24px; font-weight:800; text-transform:uppercase; margin-bottom:4px; }
      .org-sub { font-size:13px; color:#374151; }
      .student-info { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
      .info-left { flex:1; line-height:1.6; }
      .info-left p { margin:2px 0; font-size:14px; }
      .photo { width:120px; height:120px; border-radius:10px; border:1px solid #d1d5db; object-fit:cover; margin-left:20px; }
      .title { text-align:center; font-size:20px; font-weight:800; text-transform:uppercase; margin:18px 0 8px; }
      table { width:100%; border-collapse:collapse; font-size:14px; }
      th, td { border:1px solid #9ca3af; padding:8px 6px; text-align:center; }
      th { background:#f3f4f6; font-weight:700; }
      .footer { margin-top:36px; display:flex; justify-content:flex-end; padding-right:40px; }
      .sign { display:inline-block; border-top:1px solid #111; padding-top:4px; font-size:14px; font-weight:600; }
      @page { size: A4; margin: 10mm; }
      @media print { .no-print { display:none; } }
    </style>
  `;

        const subjectsRows = view.subjects.map((s, idx) => {
            const t = s.totalMarks ?? ((s.mcqTotal ?? 0) + (s.quesTotal ?? 0));
            const g = s.totalGain ?? ((s.mcqGain ?? 0) + (s.quesGain ?? 0));
            const p = t > 0 ? (g * 100) / t : 0;
            const gp = getGpa(p);
            return `
      <tr>
        <td>${idx + 1}</td>
        <td>${s.className}</td>
        <td>${s.mcqGain ?? 0}/${s.mcqTotal ?? 0}</td>
        <td>${s.quesGain ?? 0}/${s.quesTotal ?? 0}</td>
        <td>${g}/${t}</td>
        <td>${p.toFixed(2)}%</td>
        <td>${gp.grade} [${gp.point.toFixed(2)}]</td>
      </tr>
    `;
        }).join("");

        const html = `
    <!doctype html>
    <html>
      <head><meta charset="utf-8" /><title>Marksheet - ${view.studentName}</title>${styles}</head>
      <body>
        <div class="sheet">
          <div class="header">
            <img src="${ORG_LOGO}" class="logo" alt="Logo" />
            <div class="org">
              <div class="org-name">${ORG_NAME}</div>
              <div class="org-sub">${ORG_PLACE}</div>
              <div class="org-sub">Phone: ${ORG_PHONE}</div>
            </div>
          </div>

          <div class="student-info">
            <div class="info-left">
              <p><b>Student:</b> ${view.studentName}</p>
              <p><b>Student ID:</b> ${view.studentId}</p>
              <p><b>Batch:</b> ${view.batch}</p>
              <p><b>Result Type:</b> ${view.resultType}</p>
              <p><b>Date:</b> ${view.examDate ?? "-"}</p>
            </div>
            <img src="${absolute}" class="photo" alt="Student Photo"
                 onerror="this.onerror=null;this.src='${placeholder}';" />
          </div>

          <div class="title">MARK SHEET</div>

          <table>
            <thead>
              <tr>
                <th>SL No</th><th>Subject</th><th>MCQ (G/T)</th><th>Question (G/T)</th>
                <th>Total (G/T)</th><th>Percentage</th><th>GPA</th>
              </tr>
            </thead>
            <tbody>${subjectsRows}</tbody>
            <tfoot>
              <tr>
                <th colspan="4" style="text-align:right;">Grand Total</th>
                <th>${gain}/${total}</th>
                <th>${percent.toFixed(2)}%</th>
                <th>${grade} [${point.toFixed(2)}]</th>
              </tr>
            </tfoot>
          </table>

          <div class="footer"><div class="sign">Director's Signature</div></div>
        </div>

        <script>
          window.addEventListener('load', function () {
            setTimeout(function () { try { window.focus(); window.print(); } catch(e){} }, 300);
          });
          window.onafterprint = function () { try { window.close(); } catch(e){} };
        </script>
      </body>
    </html>
  `;

        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank", "width=900,height=650,top=100,left=150");
        if (!win) alert("Please allow pop-ups to print the marksheet.");
    }



    return (
        <>
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="flex items-center gap-3 justify-between bg-base-200 rounded p-4">
                        <div className="flex justify-around w-full items-center gap-3">
                            <input
                                className="input input-bordered"
                                placeholder="Search by Student ID / Name"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                            <select
                                className="select select-bordered"
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
                            <select
                                className="select select-bordered"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                            >
                                <option value="">All Classes</option>
                                {classes.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="select select-bordered"
                                value={templateId}
                                onChange={(e) => setTemplateId(e.target.value)}
                            >
                                <option value="">SMS Template</option>
                                {templates.map((t) => (
                                    <option key={t._id} value={t._id}>
                                        {t.templateName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <a href="/add-result" className="btn btn-primary">
                            Add Result
                        </a>
                    </div>
                    {smsMsg && (
                        <div className="mt-2 text-sm">{smsMsg}</div>
                    )}

                    <div className="overflow-x-auto mt-4">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>SL</th>
                                    <th>Student</th>
                                    <th>Student ID</th>
                                    <th>Batch</th>
                                    <th>Result Type</th>
                                    <th>Date</th>
                                    <th>Subjects (Gain/Total)</th>
                                    <th>Overall GPA</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r, i) => {
                                    const sSummary = (r.subjects ?? [])
                                        .map((s) => {
                                            const t =
                                                s.totalMarks ?? ((s.mcqTotal ?? 0) + (s.quesTotal ?? 0));
                                            const g =
                                                s.totalGain ?? ((s.mcqGain ?? 0) + (s.quesGain ?? 0));
                                            return `${s.className} ${g}/${t}`;
                                        })
                                        .join(", ");

                                    const total =
                                        r.totalMarks ??
                                        (r.subjects ?? []).reduce(
                                            (acc, s) => acc + (s.totalMarks ?? 0),
                                            0
                                        );
                                    const gain =
                                        r.totalGain ??
                                        (r.subjects ?? []).reduce(
                                            (acc, s) => acc + (s.totalGain ?? 0),
                                            0
                                        );
                                    const percent = total > 0 ? (gain * 100) / total : 0;
                                    const { grade, point } = getGpa(percent);

                                    return (
                                        <tr key={r._id}>
                                            <td>{i + 1}</td>
                                            <td>{r.studentName ?? "-"}</td>
                                            <td className="font-mono">{r.studentId ?? "-"}</td>
                                            <td>{r.batch ?? "-"}</td>
                                            <td>{r.resultType ?? "-"}</td>
                                            <td>{r.examDate ?? "-"}</td>
                                            <td className="max-w-[420px] whitespace-normal">{sSummary}</td>
                                            <td>
                                                {grade} [{point.toFixed(2)}]
                                            </td>
                                            <td className="text-right">
                                                <div className="join">
                                                    <button
                                                        className="btn btn-sm join-item"
                                                        onClick={() => openView(r)}
                                                    >
                                                        View
                                                    </button>
                                                    <a
                                                        className="btn btn-sm join-item"
                                                        href={`/edit-result/${r._id}`}
                                                    >
                                                        Edit
                                                    </a>
                                                    <button
                                                        className="btn btn-sm btn-success join-item text-white"
                                                        onClick={() => sendSms(r)}
                                                        disabled={!templateId || sendingId === r._id}
                                                        title={!templateId ? "Select SMS template" : "Send SMS"}
                                                    >
                                                        {sendingId === r._id ? "Sending..." : "Send SMS"}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline join-item"
                                                        onClick={() => r._id && onDelete(r._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!filtered.length && (
                                    <tr>
                                        <td colSpan={9} className="text-center opacity-60 py-10">
                                            No results
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div >

            {/* View modal */}
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box max-w-3xl">
                    <h3 className="font-bold text-lg">Result</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        <Field label="Student" value={view?.studentName} />
                        <Field label="Student ID" value={view?.studentId} mono />
                        <Field label="Batch" value={view?.batch} />
                        <Field label="Type" value={view?.resultType} />
                        <Field label="Date" value={view?.examDate || "-"} />
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>SL</th>
                                    <th>Subject</th>
                                    <th>MCQ (G/T)</th>
                                    <th>Question (G/T)</th>
                                    <th>Total (G/T)</th>
                                    <th>%</th>
                                    <th>GPA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(view?.subjects ?? []).map((s, idx) => {
                                    const t =
                                        s.totalMarks ?? ((s.mcqTotal ?? 0) + (s.quesTotal ?? 0));
                                    const g =
                                        s.totalGain ?? ((s.mcqGain ?? 0) + (s.quesGain ?? 0));
                                    const p = t > 0 ? (g * 100) / t : 0;
                                    const { grade, point } = getGpa(p);
                                    return (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td>{s.className}</td>
                                            <td>
                                                {(s.mcqGain ?? 0)} / {(s.mcqTotal ?? 0)}
                                            </td>
                                            <td>
                                                {(s.quesGain ?? 0)} / {(s.quesTotal ?? 0)}
                                            </td>
                                            <td>
                                                {g} / {t}
                                            </td>
                                            <td>{p.toFixed(2)}%</td>
                                            <td>
                                                {grade} [{point.toFixed(2)}]
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="modal-action">
                        <button className="btn btn-ghost" onClick={closeView}>
                            Close
                        </button>
                        <button className="btn btn-primary" onClick={printView}>
                            Print
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

function Field({
    label,
    value,
    mono,
}: {
    label: string;
    value?: string;
    mono?: boolean;
}) {
    return (
        <div className="flex gap-2">
            <div className="text-sm opacity-60 w-52">{label}</div>
            <div className={`font-medium ${mono ? "font-mono" : ""}`}>
                {value || "-"}
            </div>
        </div>
    );
}
