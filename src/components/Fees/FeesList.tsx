"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { IconPlus } from "@tabler/icons-react";
import type { FeeDoc } from "@/lib/types";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ORG_NAME, ORG_PHONE } from "@/lib/org";
import { useOrgLogo } from "@/hooks/use-org-logo";
import { printHtml } from "@/lib/printDocument";

const ORG_ADDR = "Cheradanghi Mor, Auliapur, Sadar, Dinajpur";

function feeInvoiceHtml(view: FeeDoc, logoUrl: string) {
    const styles = `
    .sheet{ max-width:850px; margin:0 auto; }
    .copy{ border:1px solid #111; border-radius:10px; padding:16px; margin-bottom:28px; position:relative; }
    .copy:not(:last-child)::after{ content:""; position:absolute; bottom:-16px; left:0; width:100%; border-bottom:1px dashed #9ca3af; }
    .header{ display:flex; align-items:center; gap:12px; border-bottom:2px solid #111; padding-bottom:10px; margin-bottom:12px; }
    .logo{ width:64px; height:64px; border-radius:8px; object-fit:cover; border:1px solid #e5e7eb; }
    .org{ flex:1; text-align:center; }
    .org-name{ font-size:20px; font-weight:800; text-transform:uppercase; }
    .org-sub{ font-size:12px; color:#374151; }
    .copy-title{ margin-top:4px; font-weight:700; }
    .meta th, .meta td{ border:1px solid #6b7280; text-align:left; padding:8px 10px; font-size:14px; }
    .meta th{ width:160px; background:#f3f4f6; }
    .signs{ display:flex; justify-content:space-between; gap:24px; margin-top:60px; }
    .sign{ width:45%; text-align:center; border-top:1px solid #111; padding-top:6px; font-size:13px; font-weight:600; }
  `;

    const copyHtml = (copy: "Office Copy" | "Student Copy") => `
    <div class="copy">
      <div class="header">
        <img src="${logoUrl}" class="logo" alt="Logo"/>
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

    const body = `<div class="sheet">${copyHtml("Office Copy")}${copyHtml("Student Copy")}</div>`;
    printHtml(`Fee Invoice - ${view.studentName}`, body, styles);
}

export default function FeesList({ rows }: { rows: FeeDoc[] }) {
    const logo = useOrgLogo();
    const [data, setData] = useState<FeeDoc[]>(rows);
    const [view, setView] = useState<FeeDoc | null>(null);
    const confirm = useConfirm();

    async function onDelete(id?: string) {
        if (!id) return;
        const ok = await confirm({
            title: "Delete this fee record?",
            description: "This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });
        if (!ok) return;
        const res = await fetch(`/api/fees/${id}`, { method: "DELETE" });
        if (res.ok) {
            setData((prev) => prev.filter((x) => x._id !== id));
            toast.success("Fee record deleted");
        } else toast.error("Delete failed");
    }

    const columns: DataTableColumn<FeeDoc>[] = [
        { key: "studentName", header: "Student Name", cell: (r) => r.studentName },
        { key: "studentId", header: "Student ID", cell: (r) => <span className="font-mono text-xs">{r.studentId}</span> },
        { key: "amount", header: "Amount", cell: (r) => Number(r.amount).toLocaleString() },
        { key: "depositBy", header: "Deposit By", cell: (r) => r.depositBy },
        { key: "receivedBy", header: "Received By", cell: (r) => r.receivedBy },
        { key: "date", header: "Date", cell: (r) => new Date(r.createdAt).toLocaleDateString() },
        {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (r) => (
                <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setView(r)}>
                        View
                    </Button>
                    <Link href={`/edit-fee/${r._id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Edit
                    </Link>
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
                rows={data}
                rowKey={(r) => r._id ?? r.studentId}
                columns={columns}
                searchPlaceholder="Search student / depositor"
                filterRow={(r, q) =>
                    r.studentName.toLowerCase().includes(q) ||
                    r.studentId.toLowerCase().includes(q) ||
                    r.depositBy.toLowerCase().includes(q)
                }
                emptyMessage="No records"
                toolbarRight={
                    <Link href="/add-fees" className={buttonVariants()}>
                        <IconPlus /> Collect Fee
                    </Link>
                }
            />

            <Dialog open={!!view} onOpenChange={(open) => !open && setView(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Fee Details</DialogTitle>
                    </DialogHeader>
                    {view && (
                        <div className="space-y-1.5 text-sm">
                            <p>
                                <b>Student:</b> {view.studentName}
                            </p>
                            <p>
                                <b>ID:</b> {view.studentId}
                            </p>
                            <p>
                                <b>Amount:</b> {Number(view.amount).toLocaleString()}
                            </p>
                            <p>
                                <b>Deposit By:</b> {view.depositBy}
                            </p>
                            <p>
                                <b>Received By:</b> {view.receivedBy}
                            </p>
                            <p>
                                <b>Date:</b> {new Date(view.createdAt).toLocaleString()}
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setView(null)}>
                            Close
                        </Button>
                        <Button onClick={() => view && feeInvoiceHtml(view, logo)}>Print</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
