// components/Student/StudentList.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { IconPlus } from "@tabler/icons-react";
import type { StudentDoc } from "@/lib/types";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ORG_NAME } from "@/lib/org";
import { useOrgLogo } from "@/hooks/use-org-logo";
import { printHtml } from "@/lib/printDocument";

export type StudentRow = StudentDoc & { _id: string };

type Props = {
    rows: StudentRow[];
    /** For the batch filter dropdown; not needed on the suspended page */
    batches?: string[];
    /** When true, only show suspended students */
    suspendedOnly?: boolean;
};

function initials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");
}

function studentPrintHtml(view: StudentRow, logoUrl: string) {
    const styles = `
    .card { border:1px solid #e5e7eb; border-radius:12px; padding:20px; }
    .org { display:flex; align-items:center; gap:16px; margin-bottom:16px; background:#f9fafb; padding:12px 20px; border-radius:12px; }
    .org-logo { width:64px; height:64px; object-fit:cover; border-radius:12px; border:1px solid #e5e7eb; }
    .org-meta { display:flex; flex-direction:column; gap:2px; }
    .org-name { font-size:18px; font-weight:700; }
    .org-line { font-size:13px; color:#374151; }
    .muted { color:#6b7280 }
    .header { display:flex; gap:16px; align-items:center; margin-bottom:16px; }
    .avatar { width:80px; height:80px; border-radius:12px; object-fit:cover; border:1px solid #e5e7eb; }
    .title { font-size:20px; font-weight:600; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px 24px; }
    .row { display:flex; gap:8px; }
    .label { width:160px; color:#6b7280; }
    .val { font-weight:500; }
  `;

    const img = view.photoUrl
        ? `<img src="${view.photoUrl}" class="avatar" />`
        : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;background:#f3f4f6;color:#9ca3af;">No Photo</div>`;

    const body = `
    <div class="card">
      <div class="org">
        <img src="${logoUrl}" alt="Coaching Logo" class="org-logo" />
        <div class="org-meta">
          <div class="org-name">${ORG_NAME}</div>
          <div class="org-line">Address: Cheradanghi Mor, Auliapur, Sadar, Dinajpur</div>
          <div class="org-line">Established: 2018</div>
          <div class="org-line">Mobile: 01798930232, 01898930232</div>
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
  `;

    printHtml(`${view.name} - ${view.studentId}`, body, styles);
}

export default function StudentList({ rows, batches = [], suspendedOnly = false }: Props) {
    const logo = useOrgLogo();
    const [data, setData] = useState<StudentRow[]>(rows);
    const [batch, setBatch] = useState<string>("all");
    const [roll, setRoll] = useState("");
    const [view, setView] = useState<StudentRow | null>(null);
    const confirm = useConfirm();

    const scoped = data
        .filter((r) => (suspendedOnly ? r.isSuspended === true : r.isSuspended !== true))
        .filter((r) => batch === "all" || r.batch === batch)
        .filter((r) => !roll || r.roll === roll);

    async function onDelete(id: string) {
        const ok = await confirm({
            title: "Delete this student?",
            description: "This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });
        if (!ok) return;
        const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
        if (res.ok) {
            setData((prev) => prev.filter((x) => x._id !== id));
            toast.success("Student deleted");
        } else toast.error("Delete failed");
    }

    async function onSuspend(id: string) {
        const flag = !suspendedOnly;
        const ok = await confirm({ title: flag ? "Suspend this student?" : "Re-admit this student?" });
        if (!ok) return;
        const res = await fetch(`/api/students/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isSuspended: flag }),
        });
        if (res.ok) {
            setData((prev) => prev.map((x) => (x._id === id ? { ...x, isSuspended: flag } : x)));
            toast.success(flag ? "Student suspended" : "Student re-admitted");
        } else toast.error("Action failed");
    }

    const columns: DataTableColumn<StudentRow>[] = [
        {
            key: "photo",
            header: "",
            cell: (r) => (
                <Avatar className="size-9 rounded-md">
                    <AvatarImage src={r.photoUrl} alt={r.name} />
                    <AvatarFallback className="rounded-md">{initials(r.name)}</AvatarFallback>
                </Avatar>
            ),
        },
        { key: "studentId", header: "Student ID", cell: (r) => <span className="font-mono text-xs">{r.studentId}</span> },
        { key: "name", header: "Name", cell: (r) => r.name },
        { key: "batch", header: "Batch", cell: (r) => r.batch },
        { key: "roll", header: "Roll", cell: (r) => r.roll },
        { key: "division", header: "Division", cell: (r) => r.division || "-" },
        {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (r) => (
                <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setView(r)}>
                        View
                    </Button>
                    <Link href={`/edit-student/${r._id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Edit
                    </Link>
                    <Button size="sm" variant={suspendedOnly ? "default" : "secondary"} onClick={() => onSuspend(r._id)}>
                        {suspendedOnly ? "Re-admit" : "Suspend"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(r._id)}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <DataTable
                rows={scoped}
                rowKey={(r) => r._id}
                columns={columns}
                searchPlaceholder="Search (name / id / batch / roll / phone)"
                filterRow={(r, q) =>
                    r.name.toLowerCase().includes(q) ||
                    r.studentId.toLowerCase().includes(q) ||
                    r.batch.toLowerCase().includes(q) ||
                    r.roll.toLowerCase().includes(q) ||
                    (r.guardianName || "").toLowerCase().includes(q) ||
                    (r.guardianPhone || "").toLowerCase().includes(q)
                }
                emptyMessage={suspendedOnly ? "No suspended students" : "No students"}
                toolbarRight={
                    <div className="flex flex-wrap items-center gap-2">
                        {batches.length > 0 && (
                            <Select value={batch} onValueChange={(v) => setBatch(v ?? "all")}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="All Batches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Batches</SelectItem>
                                    {batches.map((b) => (
                                        <SelectItem key={b} value={b}>
                                            {b}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Input className="w-28" placeholder="Roll" value={roll} onChange={(e) => setRoll(e.target.value)} />
                        {!suspendedOnly && (
                            <Link href="/add-student" className={buttonVariants()}>
                                <IconPlus /> Add Student
                            </Link>
                        )}
                    </div>
                }
            />

            <Dialog open={!!view} onOpenChange={(open) => !open && setView(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <div className="flex items-start gap-4">
                            <Avatar className="size-16 rounded-md">
                                <AvatarImage src={view?.photoUrl} alt={view?.name} />
                                <AvatarFallback className="rounded-md">{view ? initials(view.name) : ""}</AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle>{view?.name}</DialogTitle>
                                <div className="font-mono text-sm text-muted-foreground">{view?.studentId}</div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setView(null)}>
                            Close
                        </Button>
                        <Button onClick={() => view && studentPrintHtml(view, logo)}>Print</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function Field({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex gap-2 text-sm">
            <div className="w-40 text-muted-foreground">{label}</div>
            <div className="font-medium">{value || "-"}</div>
        </div>
    );
}
