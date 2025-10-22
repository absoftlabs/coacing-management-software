"use client";

import { useState, useMemo, useRef } from "react";
import type { FeeDoc } from "@/lib/types";

const ORG_NAME = "Prottasha Coaching Center";
const ORG_LOGO = "https://i.ibb.co.com/cXwWBJCC/logo2.png";
const ORG_ADDR = "Cheradanghi Mor, Auliapur, Sadar, Dinajpur";
const ORG_PHONE = "01798930232";

type Props = { rows: FeeDoc[] };

export default function FeesList({ rows }: Props) {
    const [data, setData] = useState<FeeDoc[]>(rows);
    const [q, setQ] = useState<string>("");
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [view, setView] = useState<FeeDoc | null>(null);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return data.filter((r) => {
            if (!s) return true;
            return (
                r.studentName.toLowerCase().includes(s) ||
                r.studentId.toLowerCase().includes(s) ||
                r.depositBy.toLowerCase().includes(s)
            );
        });
    }, [q, data]);

    async function onDelete(id?: string) {
        if (!id) return;
        if (!confirm("Delete this record?")) return;
        const res = await fetch(`/api/fees/${id}`, { method: "DELETE" });
        if (res.ok) setData((prev) => prev.filter((x) => x._id !== id));
        else alert("Delete failed");
    }

    function openView(item: FeeDoc) {
        setView(item);
        dialogRef.current?.showModal();
    }
    function closeView() {
        dialogRef.current?.close();
        setView(null);
    }

    // Print invoice (stacked layout)
    function printInvoice() {
        if (!view) return;

        const rowHtml = (copy: "Office Copy" | "Student Copy") => `
      <div class="copy">
        <div class="header">
          <img src="${ORG_LOGO}" class="logo" alt="Logo"/>
          <div class="org">
            <div class="org-name">${ORG_NAME}</div>
            <div class="org-sub">${ORG_ADDR}</div>
            <div class="org-sub">Phone: ${ORG_PHONE}</div>
            <div class="copy-title">${copy}</div>
          </div>
        </div>

        <table class="meta">
          <tr><th>Student Name</th><td>${view.studentName}</td></tr>
          <tr><th>Student ID</th><td>${view.studentId}</td></tr>
          <tr><th>Amount</th><td>${Number(view.amount).toLocaleString()}</td></tr>
          <tr><th>Deposit By</th><td>${view.depositBy}</td></tr>
          <tr><th>Received By</th><td>${view.receivedBy}</td></tr>
          <tr><th>Date</th><td>${new Date(view.createdAt).toLocaleString()}</td></tr>
        </table>

        <div class="signs">
          <div class="sign">Depositor Sign</div>
          <div class="sign">Received Sign</div>
        </div>
      </div>
    `;

        const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Fee Invoice - ${view.studentName}</title>
    <style>
      :root {
        --border:#111;
        --muted:#374151;
      }
      body{ font-family: ui-sans-serif, system-ui, -apple-system; margin:0; padding:20px; color:#111; background:#fff; }
      .sheet{ max-width:850px; margin:0 auto; }

      /* Copies stacked vertically */
      .copy{
        border:1px solid var(--border);
        border-radius:10px;
        padding:16px;
        margin-bottom:28px;
        position:relative;
      }

      /* Cut line between two copies */
      .copy:not(:last-child)::after{
        content:"";
        position:absolute;
        bottom:-16px;
        left:0;
        width:100%;
        border-bottom:1px dashed #9ca3af;
      }

      .header{
        display:flex; align-items:center; gap:12px;
        border-bottom:2px solid var(--border); padding-bottom:10px; margin-bottom:12px;
      }
      .logo{ width:64px; height:64px; border-radius:8px; object-fit:cover; border:1px solid #e5e7eb; }
      .org{ flex:1; text-align:center; }
      .org-name{ font-size:20px; font-weight:800; text-transform:uppercase; }
      .org-sub{ font-size:12px; color:var(--muted); }
      .copy-title{ margin-top:4px; font-weight:700; }

      table{ width:100%; border-collapse:collapse; }
      .meta th, .meta td{ border:1px solid #6b7280; text-align:left; padding:8px 10px; font-size:14px; }
      .meta th{ width:160px; background:#f3f4f6; }

      .signs{ display:flex; justify-content:space-between; gap:24px; margin-top:32px; }
      .sign{
        width:45%; text-align:center; border-top:1px solid var(--border); padding-top:6px; font-size:13px; font-weight:600;
      }

      @media print{
        .no-print{ display:none; }
        body{ padding:0; }
        .sheet{ margin:0; }
      }
    .signs{ margin-top:60px; }
    </style>
  </head>
  <body>
    <div class="sheet">
      ${rowHtml("Office Copy")}
      ${rowHtml("Student Copy")}
    </div>
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => { try { window.focus(); window.print(); } catch(e){} }, 200);
      });
    </script>
  </body>
</html>
    `.trim();

        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const w = window.open(url, "_blank", "width=900,height=700,noopener");
        if (!w) alert("Please allow pop-ups to print the invoice.");
    }

    return (
        <>
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="flex items-center gap-3 justify-between bg-base-200 rounded p-4">
                        <input
                            className="input input-bordered"
                            placeholder="Search student / depositor"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <a href="/add-fees" className="btn btn-primary">Collect Fee</a>
                    </div>

                    <div className="overflow-x-auto mt-4">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>SL</th>
                                    <th>Student Name</th>
                                    <th>Student ID</th>
                                    <th>Amount</th>
                                    <th>Deposit By</th>
                                    <th>Received By</th>
                                    <th>Date</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r, idx) => (
                                    <tr key={r._id}>
                                        <td>{idx + 1}</td>
                                        <td>{r.studentName}</td>
                                        <td className="font-mono">{r.studentId}</td>
                                        <td>{Number(r.amount).toLocaleString()}</td>
                                        <td>{r.depositBy}</td>
                                        <td>{r.receivedBy}</td>
                                        <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                                        <td className="text-right">
                                            <div className="join">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm join-item"
                                                    onClick={() => openView(r)}
                                                >
                                                    View
                                                </button>
                                                <a
                                                    className="btn btn-sm join-item"
                                                    href={`/edit-fee/${r._id}`}
                                                >
                                                    Edit
                                                </a>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline join-item"
                                                    onClick={() => onDelete(r._id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!filtered.length && (
                                    <tr>
                                        <td colSpan={8} className="text-center opacity-60 py-10">
                                            No records
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* View Modal */}
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box max-w-2xl">
                    <h3 className="font-bold text-lg mb-2">Fee Details</h3>
                    {view && (
                        <div className="space-y-2">
                            <p><b>Student:</b> {view.studentName}</p>
                            <p><b>ID:</b> {view.studentId}</p>
                            <p><b>Amount:</b> {Number(view.amount).toLocaleString()}</p>
                            <p><b>Deposit By:</b> {view.depositBy}</p>
                            <p><b>Received By:</b> {view.receivedBy}</p>
                            <p><b>Date:</b> {new Date(view.createdAt).toLocaleString()}</p>
                        </div>
                    )}

                    <div className="modal-action">
                        <button type="button" className="btn btn-ghost" onClick={closeView}>
                            Close
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={printInvoice}
                        >
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
