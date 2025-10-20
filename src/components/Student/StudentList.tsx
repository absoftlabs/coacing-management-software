// components/Student/StudentList.tsx
"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";

export type Row = {
    _id: string;
    studentId: string;
    name: string;
    batch: string;
    roll: string;
    division?: string;
    schoolName?: string;
    schoolRoll?: string;
    schoolSection?: string;
    address?: string;
    fatherName?: string;
    motherName?: string;
    guardianName?: string;
    guardianPhone?: string;
    gender?: string;
    photoUrl?: string;      // base64 data URL বা remote url
    birthDate?: string;
    courseFee?: number;
    isSuspended?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

type Props = {
    rows: Row[];
    /** ব্যাচ ফিল্টার/ড্রপডাউনের জন্য; সাসপেন্ডেড পেজে দরকার নাও হতে পারে */
    batches?: string[];
    /** সত্য হলে কেবল suspended স্টুডেন্ট দেখাবো */
    suspendedOnly?: boolean;
};

export default function StudentList({
    rows,
    batches = [],
    suspendedOnly = false,
}: Props) {
    const [q, setQ] = useState("");
    const [batch, setBatch] = useState("");
    const [roll, setRoll] = useState("");
    const [data, setData] = useState<Row[]>(rows);

    // view modal
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const [view, setView] = useState<Row | null>(null);

    const filtered = useMemo(() => {
        const s = q.toLowerCase();
        let out = data.filter((r) => {
            const okQ =
                !q ||
                r.name.toLowerCase().includes(s) ||
                r.studentId.toLowerCase().includes(s) ||
                r.batch.toLowerCase().includes(s) ||
                r.roll.toLowerCase().includes(s) ||
                (r.guardianName || "").toLowerCase().includes(s) ||
                (r.guardianPhone || "").toLowerCase().includes(s);

            const okB = !batch || r.batch === batch;
            const okR = !roll || r.roll === roll;
            return okQ && okB && okR;
        });

        // suspendedOnly হলে কেবল suspended এন্ট্রি দেখাই,
        // নাহলে active গুলো দেখাই (suspended বাদ)
        out = out.filter((r) =>
            suspendedOnly ? r.isSuspended === true : r.isSuspended !== true
        );

        return out;
    }, [q, batch, roll, data, suspendedOnly]);

    async function onDelete(id: string) {
        if (!confirm("Delete student?")) return;
        const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
        if (res.ok) setData((prev) => prev.filter((x) => x._id !== id));
        else alert("Delete failed");
    }

    async function onSuspend(id: string) {
        const confirmText = suspendedOnly ? "Re-admit this student?" : "Suspend this student?";
        if (!confirm(confirmText)) return;

        const flag = !suspendedOnly; // suspended পেজে -> re-admit (false), else -> suspend (true)
        const res = await fetch(`/api/students/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isSuspended: flag }),
        });

        if (res.ok) {
            setData((prev) =>
                prev.map((x) => (x._id === id ? { ...x, isSuspended: flag } : x))
            );
        } else {
            alert("Action failed");
        }
    }

    function openView(item: Row) {
        setView(item);
        dialogRef.current?.showModal();
    }
    function closeView() {
        dialogRef.current?.close();
        setView(null);
    }

    function printView() {
        if (!view) return;
        const win = window.open("", "PRINT", "height=650,width=900,top=100,left=150");
        if (!win) return;

        const styles = `
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system; padding: 24px; }
    .card { border:1px solid #e5e7eb; border-radius:12px; padding:20px; }
    /* === Coaching Header === */
    .org { display:flex; align-items:center; gap:16px; margin-bottom:16px; background:#f9fafb; padding:12px 20px; border-radius:12px; }
    .org-logo { width:64px; height:64px; object-fit:cover; border-radius:12px; border:1px solid #e5e7eb; }
    .org-meta { display:flex; flex-direction:column; gap:2px; }
    .org-name { font-size:18px; font-weight:700; }
    .org-line { font-size:13px; color:#374151; }
    .muted { color:#6b7280 }
    /* === Student Header & Grid === */
    .header { display:flex; gap:16px; align-items:center; margin-bottom:16px; }
    .avatar { width:80px; height:80px; border-radius:12px; object-fit:cover; border:1px solid #e5e7eb; }
    .title { font-size:20px; font-weight:600; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px 24px; }
    .row { display:flex; gap:8px; }
    .label { width:160px; color:#6b7280; }
    .val { font-weight:500; }
    @media print { .no-print { display:none } }
  </style>
`;

        // প্রতিষ্ঠান তথ্য (ইচ্ছা করলে settings থেকে আসবে)
        const logoUrl = "https://i.ibb.co.com/cXwWBJCC/logo2.png"; // public/logo2.png (স্ট্যাটিক)
        const ORG_NAME = "Prottasha Coaching Center";
        const ORG_PLACE = "Address: Cheradanghi Mor, Auliapur, Sadar, Dinajpur";
        const ORG_EST = "Established: 2018";
        const ORG_MOBILE = "Mobile: 01798930232, 01898930232";

        const img = view.photoUrl
            ? `<img src="${view.photoUrl}" class="avatar" />`
            : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;background:#f3f4f6;color:#9ca3af;">No Photo</div>`;

        const html = `
<html>
  <head>
    <title>${view.name} - ${view.studentId}</title>
    ${styles}
  </head>
  <body onload="window.print();window.close()">
    <div class="card">
      <div class="org">
        <img src="${logoUrl}" alt="Coaching Logo" class="org-logo" />
        <div class="org-meta">
          <div class="org-name">${ORG_NAME}</div>
          <div class="org-line">${ORG_PLACE}</div>
          <div class="org-line">${ORG_EST}</div>
          <div class="org-line">${ORG_MOBILE}</div>
        </div>
      </div>

      <div class="org-line muted" style="margin-bottom:8px;">Student Details</div>

      <div class="header">
        ${img}
        <div>
          <div class="title">${view.name}</div>
          <div class="mono">${view.studentId}</div>
        </div>
      </div>

      <div class="grid">
        <div class="row"><div class="label">Batch</div><div class="val">${view.batch || "-"}</div></div>
        <div class="row"><div class="label">Roll</div><div class="val">${view.roll || "-"}</div></div>
        <div class="row"><div class="label">Division</div><div class="val">${view.division || "-"}</div></div>
        <div class="row"><div class="label">Gender</div><div class="val">${view.gender || "-"}</div></div>
        <div class="row"><div class="label">School Name</div><div class="val">${view.schoolName || "-"}</div></div>
        <div class="row"><div class="label">School Roll</div><div class="val">${view.schoolRoll || "-"}</div></div>
        <div class="row"><div class="label">School Section</div><div class="val">${view.schoolSection || "-"}</div></div>
        <div class="row"><div class="label">Address</div><div class="val">${view.address || "-"}</div></div>
        <div class="row"><div class="label">Father</div><div class="val">${view.fatherName || "-"}</div></div>
        <div class="row"><div class="label">Mother</div><div class="val">${view.motherName || "-"}</div></div>
        <div class="row"><div class="label">Guardian</div><div class="val">${view.guardianName || "-"}</div></div>
        <div class="row"><div class="label">Guardian Phone</div><div class="val">${view.guardianPhone || "-"}</div></div>
      </div>
    </div>
  </body>
</html>
`;
        win.document.write(html);
        win.document.close();
    }

    return (
        <>
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="flex flex-col lg:flex-row gap-3 items-end justify-between">
                        <div className="flex flex-wrap gap-3">
                            <input
                                className="input input-bordered"
                                placeholder="Search (name / id / batch / roll / phone)"
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
                            <input
                                className="input input-bordered w-32"
                                placeholder="Roll"
                                value={roll}
                                onChange={(e) => setRoll(e.target.value)}
                            />
                        </div>
                        <a href="/add-student" className="btn btn-primary">
                            Add Student
                        </a>
                    </div>

                    <div className="overflow-x-auto mt-4">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>Photo</th>
                                    <th>SL</th>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Batch</th>
                                    <th>Roll</th>
                                    <th>Division</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r, i) => (
                                    <tr key={r._id}>
                                        <td>
                                            {r.photoUrl ? (
                                                <Image
                                                    src={r.photoUrl}
                                                    alt={r.name}
                                                    width={48}
                                                    height={48}
                                                    className="mask mask-squircle w-12 h-12 object-cover"
                                                    // data URL/unauthorized domain হলে অপ্টিমাইজেশন দরকার নেই
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="mask mask-squircle w-12 h-12 bg-base-200 flex items-center justify-center text-xs text-base-content/50">
                                                    No Pic
                                                </div>
                                            )}
                                        </td>
                                        <td>{i + 1}</td>
                                        <td className="font-mono">{r.studentId}</td>
                                        <td>{r.name}</td>
                                        <td>{r.batch}</td>
                                        <td>{r.roll}</td>
                                        <td>{r.division || "-"}</td>
                                        <td className="text-right">
                                            <div className="join">
                                                <button
                                                    onClick={() => openView(r)}
                                                    className="btn btn-sm join-item"
                                                >
                                                    View
                                                </button>
                                                <a
                                                    href={`/edit-student/${r._id}`}
                                                    className="btn btn-sm join-item"
                                                >
                                                    Edit
                                                </a>

                                                {/* suspendedOnly অনুযায়ী বাটন পাল্টাবে */}
                                                {suspendedOnly ? (
                                                    <button
                                                        onClick={() => onSuspend(r._id)}
                                                        className="btn btn-sm btn-accent join-item"
                                                    >
                                                        Re-admit
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => onSuspend(r._id)}
                                                        className="btn btn-sm btn-warning join-item"
                                                    >
                                                        Suspend
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => onDelete(r._id)}
                                                    className="btn btn-sm btn-outline join-item"
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
                                            No students
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
                <div className="modal-box max-w-3xl">
                    <div className="flex items-start gap-4">
                        {view?.photoUrl ? (
                            <Image
                                src={view.photoUrl}
                                alt="Student Photo"
                                width={80}
                                height={80}
                                className="mask mask-squircle w-20 h-20 object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="mask mask-squircle w-20 h-20 bg-base-200 flex items-center justify-center text-xs text-base-content/50">
                                No Pic
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-lg">{view?.name}</h3>
                            <div className="text-sm opacity-70 font-mono">{view?.studentId}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <Field label="Batch" value={view?.batch} />
                        <Field label="Roll" value={view?.roll} />
                        <Field label="Division" value={view?.division} />
                        <Field label="Gender" value={view?.gender} />
                        <Field label="School Name" value={view?.schoolName} />
                        <Field label="School Roll" value={view?.schoolRoll} />
                        <Field label="School Section" value={view?.schoolSection} />
                        <Field label="Address" value={view?.address} />
                        <Field label="Father" value={view?.fatherName} />
                        <Field label="Mother" value={view?.motherName} />
                        <Field label="Guardian" value={view?.guardianName} />
                        <Field label="Guardian Phone" value={view?.guardianPhone} />
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

function Field({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex gap-2">
            <div className="text-sm opacity-60 w-40">{label}</div>
            <div className="font-medium">{value || "-"}</div>
        </div>
    );
}
