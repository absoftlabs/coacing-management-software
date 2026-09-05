"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ResultDoc } from "@/lib/types";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { IconPlus } from "@tabler/icons-react";
import { ORG_NAME, ORG_PHONE } from "@/lib/org";
import { useOrgLogo } from "@/hooks/use-org-logo";
import { printHtml } from "@/lib/printDocument";

type Props = {
    rows: ResultDoc[];
    batches: string[];
    classes: string[];
};

function getGpa(percent: number) {
    if (percent >= 80) return { grade: "A+", point: 5.0 };
    if (percent >= 70) return { grade: "A", point: 4.0 };
    if (percent >= 60) return { grade: "A-", point: 3.5 };
    if (percent >= 50) return { grade: "B", point: 3.0 };
    if (percent >= 40) return { grade: "C", point: 2.0 };
    if (percent >= 33) return { grade: "D", point: 1.0 };
    return { grade: "F", point: 0.0 };
}

async function printResult(view: ResultDoc, logoUrl: string) {
    type StudentLite = { _id: string; studentId: string; name?: string; photoUrl?: string };

    let student: StudentLite | null = null;
    try {
        const res = await fetch(`/api/students?q=${encodeURIComponent(view.studentId)}`, { cache: "no-store" });
        if (res.ok) {
            const list: StudentLite[] = await res.json();
            student = list.find((x) => x.studentId === view.studentId) ?? null;
        }
    } catch {
        // ignore
    }

    const placeholder = "https://via.placeholder.com/120x120.png?text=No+Photo";
    const raw = student?.photoUrl?.trim();
    const absolute = (() => {
        if (!raw) return placeholder;
        if (raw.startsWith("data:")) return raw;
        if (/^https?:\/\//i.test(raw)) return raw;
        try {
            return new URL(raw, window.location.origin).toString();
        } catch {
            return placeholder;
        }
    })();

    const total = view.totalMarks ?? view.subjects.reduce((acc, s) => acc + (s.totalMarks ?? 0), 0);
    const gain = view.totalGain ?? view.subjects.reduce((acc, s) => acc + (s.totalGain ?? 0), 0);
    const percent = total > 0 ? (gain * 100) / total : 0;
    const { grade, point } = getGpa(percent);

    const styles = `
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
    th, td { text-align:center; }
    .footer { margin-top:36px; display:flex; justify-content:flex-end; padding-right:40px; }
    .sign { display:inline-block; border-top:1px solid #111; padding-top:4px; font-size:14px; font-weight:600; }
  `;

    const subjectsRows = view.subjects
        .map((s, idx) => {
            const t = s.totalMarks ?? (s.mcqTotal ?? 0) + (s.quesTotal ?? 0);
            const g = s.totalGain ?? (s.mcqGain ?? 0) + (s.quesGain ?? 0);
            const p = t > 0 ? (g * 100) / t : 0;
            const gp = getGpa(p);
            return `<tr><td>${idx + 1}</td><td>${s.className}</td><td>${s.mcqGain ?? 0}/${s.mcqTotal ?? 0}</td><td>${s.quesGain ?? 0}/${s.quesTotal ?? 0}</td><td>${g}/${t}</td><td>${p.toFixed(2)}%</td><td>${gp.grade} [${gp.point.toFixed(2)}]</td></tr>`;
        })
        .join("");

    const body = `
    <div class="sheet">
      <div class="header">
        <img src="${logoUrl}" class="logo" alt="Logo" />
        <div class="org">
          <div class="org-name">${ORG_NAME}</div>
          <div class="org-sub">Cheradanghi Mor, Auliapur, Sadar, Dinajpur</div>
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
        <img src="${absolute}" class="photo" alt="Student Photo" onerror="this.onerror=null;this.src='${placeholder}';" />
      </div>
      <div class="title">MARK SHEET</div>
      <table>
        <thead><tr><th>SL No</th><th>Subject</th><th>MCQ (G/T)</th><th>Question (G/T)</th><th>Total (G/T)</th><th>Percentage</th><th>GPA</th></tr></thead>
        <tbody>${subjectsRows}</tbody>
        <tfoot><tr><th colspan="4" style="text-align:right;">Grand Total</th><th>${gain}/${total}</th><th>${percent.toFixed(2)}%</th><th>${grade} [${point.toFixed(2)}]</th></tr></tfoot>
      </table>
      <div class="footer"><div class="sign">Director's Signature</div></div>
    </div>
  `;

    printHtml(`Marksheet - ${view.studentName}`, body, styles);
}

export default function ResultList({ rows, batches, classes }: Props) {
    const logo = useOrgLogo();
    const [data, setData] = useState<ResultDoc[]>(rows);
    const [batch, setBatch] = useState<string>("all");
    const [className, setClassName] = useState<string>("all");
    const [templates, setTemplates] = useState<Array<{ _id: string; templateName: string }>>([]);
    const [templateId, setTemplateId] = useState<string>("");
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [view, setView] = useState<ResultDoc | null>(null);
    const confirm = useConfirm();

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/sms/templates", { cache: "no-store" });
                if (!res.ok) return;
                const list = (await res.json()) as Array<{ _id: string; templateName: string }>;
                setTemplates(list);
                if (list.length) setTemplateId((prev) => prev || list[0]._id);
            } catch {
                // ignore
            }
        })();
    }, []);

    const scoped = data
        .filter((r) => batch === "all" || r.batch === batch)
        .filter((r) => className === "all" || (r.subjects ?? []).some((s) => s.className === className));

    async function onDelete(id?: string) {
        if (!id) return;
        const ok = await confirm({
            title: "Delete this result?",
            description: "This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });
        if (!ok) return;
        const res = await fetch(`/api/results/${id}`, { method: "DELETE" });
        if (res.ok) {
            setData((prev) => prev.filter((x) => x._id !== id));
            toast.success("Result deleted");
        } else toast.error("Delete failed");
    }

    async function sendSms(r: ResultDoc) {
        if (!templateId) {
            toast.error("Please select an SMS template first.");
            return;
        }
        if (!r._id) return;
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
                    coachingName: ORG_NAME,
                }),
            });
            if (res.ok) toast.success("SMS sent");
            else {
                const j = (await res.json().catch(() => ({}))) as { error?: string };
                toast.error(j.error ?? "SMS failed");
            }
        } finally {
            setSendingId(null);
        }
    }

    const columns: DataTableColumn<ResultDoc>[] = [
        { key: "studentName", header: "Student", cell: (r) => r.studentName ?? "-" },
        { key: "studentId", header: "Student ID", cell: (r) => <span className="font-mono text-xs">{r.studentId ?? "-"}</span> },
        { key: "batch", header: "Batch", cell: (r) => r.batch ?? "-" },
        { key: "resultType", header: "Result Type", cell: (r) => r.resultType ?? "-" },
        { key: "date", header: "Date", cell: (r) => r.examDate ?? "-" },
        {
            key: "subjects",
            header: "Subjects (Gain/Total)",
            className: "max-w-[360px] whitespace-normal",
            cell: (r) =>
                (r.subjects ?? [])
                    .map((s) => {
                        const t = s.totalMarks ?? (s.mcqTotal ?? 0) + (s.quesTotal ?? 0);
                        const g = s.totalGain ?? (s.mcqGain ?? 0) + (s.quesGain ?? 0);
                        return `${s.className} ${g}/${t}`;
                    })
                    .join(", "),
        },
        {
            key: "gpa",
            header: "Overall GPA",
            cell: (r) => {
                const total = r.totalMarks ?? (r.subjects ?? []).reduce((acc, s) => acc + (s.totalMarks ?? 0), 0);
                const gain = r.totalGain ?? (r.subjects ?? []).reduce((acc, s) => acc + (s.totalGain ?? 0), 0);
                const percent = total > 0 ? (gain * 100) / total : 0;
                const { grade, point } = getGpa(percent);
                return `${grade} [${point.toFixed(2)}]`;
            },
        },
        {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (r) => (
                <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setView(r)}>
                        View
                    </Button>
                    <Link href={`/edit-result/${r._id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Edit
                    </Link>
                    <Button
                        size="sm"
                        onClick={() => sendSms(r)}
                        disabled={!templateId || sendingId === r._id}
                        title={!templateId ? "Select SMS template" : "Send SMS"}
                    >
                        {sendingId === r._id ? "Sending..." : "Send SMS"}
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
                rowKey={(r) => r._id ?? `${r.studentId}-${r.examDate}`}
                columns={columns}
                searchPlaceholder="Search by Student ID / Name"
                filterRow={(r, q) => (r.studentId ?? "").toLowerCase().includes(q) || (r.studentName ?? "").toLowerCase().includes(q)}
                emptyMessage="No results"
                toolbarRight={
                    <div className="flex flex-wrap items-center gap-2">
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
                        <Select value={className} onValueChange={(v) => setClassName(v ?? "all")}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? "")}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="SMS Template" />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map((t) => (
                                    <SelectItem key={t._id} value={t._id}>
                                        {t.templateName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Link href="/add-result" className={buttonVariants()}>
                            <IconPlus /> Add Result
                        </Link>
                    </div>
                }
            />

            <Dialog open={!!view} onOpenChange={(open) => !open && setView(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Result</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <Field label="Student" value={view?.studentName} />
                        <Field label="Student ID" value={view?.studentId} mono />
                        <Field label="Batch" value={view?.batch} />
                        <Field label="Type" value={view?.resultType} />
                        <Field label="Date" value={view?.examDate || "-"} />
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SL</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>MCQ (G/T)</TableHead>
                                    <TableHead>Question (G/T)</TableHead>
                                    <TableHead>Total (G/T)</TableHead>
                                    <TableHead>%</TableHead>
                                    <TableHead>GPA</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(view?.subjects ?? []).map((s, idx) => {
                                    const t = s.totalMarks ?? (s.mcqTotal ?? 0) + (s.quesTotal ?? 0);
                                    const g = s.totalGain ?? (s.mcqGain ?? 0) + (s.quesGain ?? 0);
                                    const p = t > 0 ? (g * 100) / t : 0;
                                    const { grade, point } = getGpa(p);
                                    return (
                                        <TableRow key={idx}>
                                            <TableCell>{idx + 1}</TableCell>
                                            <TableCell>{s.className}</TableCell>
                                            <TableCell>
                                                {s.mcqGain ?? 0} / {s.mcqTotal ?? 0}
                                            </TableCell>
                                            <TableCell>
                                                {s.quesGain ?? 0} / {s.quesTotal ?? 0}
                                            </TableCell>
                                            <TableCell>
                                                {g} / {t}
                                            </TableCell>
                                            <TableCell>{p.toFixed(2)}%</TableCell>
                                            <TableCell>
                                                {grade} [{point.toFixed(2)}]
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setView(null)}>
                            Close
                        </Button>
                        <Button onClick={() => view && printResult(view, logo)}>Print</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
    return (
        <div className="flex gap-2 text-sm">
            <div className="w-40 text-muted-foreground">{label}</div>
            <div className={`font-medium ${mono ? "font-mono" : ""}`}>{value || "-"}</div>
        </div>
    );
}
