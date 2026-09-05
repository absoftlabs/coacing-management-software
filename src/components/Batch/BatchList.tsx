// src/components/Batch/BatchList.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconPlus } from "@tabler/icons-react";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export type BatchRow = {
    _id: string;
    name: string;
    totalClass: number;
    totalStudent: number;
};

export default function BatchList({ rows }: { rows: BatchRow[] }) {
    const [data, setData] = useState<BatchRow[]>(rows);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<BatchRow | null>(null);
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const confirm = useConfirm();

    function openAdd() {
        setEditing(null);
        setName("");
        setOpen(true);
    }
    function openEdit(item: BatchRow) {
        setEditing(item);
        setName(item.name);
        setOpen(true);
    }

    async function saveBatch() {
        const body = { name: name.trim() };
        if (!body.name) return;
        setSaving(true);

        if (editing) {
            const res = await fetch(`/api/batches/${editing._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                toast.error(j.error || "Failed to update");
                setSaving(false);
                return;
            }
            const updated = (await res.json()) as { _id: string; name: string };
            setData((prev) => prev.map((x) => (x._id === updated._id ? { ...x, name: updated.name } : x)));
            toast.success("Batch updated");
        } else {
            const res = await fetch("/api/batches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                toast.error(j.error || "Failed to create");
                setSaving(false);
                return;
            }
            const created = (await res.json()) as { _id: string; name: string };
            setData((prev) => [{ _id: created._id, name: created.name, totalClass: 0, totalStudent: 0 }, ...prev]);
            toast.success("Batch created");
        }
        setSaving(false);
        setOpen(false);
    }

    async function onDelete(id: string) {
        const ok = await confirm({
            title: "Delete this batch?",
            description: "This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });
        if (!ok) return;
        const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            toast.error(j.error || "Failed to delete");
            return;
        }
        setData((prev) => prev.filter((x) => x._id !== id));
        toast.success("Batch deleted");
    }

    const columns: DataTableColumn<BatchRow>[] = [
        { key: "name", header: "Batch Name", cell: (r) => <span className="font-medium">{r.name}</span> },
        { key: "totalClass", header: "Total Class", cell: (r) => r.totalClass },
        { key: "totalStudent", header: "Total Student", cell: (r) => r.totalStudent },
        {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (r) => (
                <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                        Edit
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
                rows={data}
                rowKey={(r) => r._id}
                columns={columns}
                searchPlaceholder="Type batch name..."
                filterRow={(r, q) => r.name.toLowerCase().includes(q)}
                emptyMessage="No batches"
                toolbarRight={
                    <Button onClick={openAdd}>
                        <IconPlus /> Add Batch
                    </Button>
                }
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit Batch" : "Add Batch"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="batchName">Batch Name</Label>
                        <Input
                            id="batchName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. HSC-26 Batch A"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveBatch} disabled={saving}>
                            {editing ? "Update Batch" : "Save Batch"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
