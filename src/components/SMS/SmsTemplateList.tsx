// src/components/SMS/SmsTemplateList.tsx
"use client";

import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";

export type SmsTemplateRow = {
    _id: string;
    templateName: string;
    templateBody: string;
    createdAt: string;
    updatedAt: string;
};

type Props = {
    rows: SmsTemplateRow[];
    loading?: boolean;
    onEdit: (tpl: SmsTemplateRow) => void;
    onDeleted: () => void;
};

export default function SmsTemplateList({ rows, loading, onEdit, onDeleted }: Props) {
    const confirm = useConfirm();

    async function onDelete(id: string) {
        const ok = await confirm({
            title: "Delete this template?",
            description: "This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });
        if (!ok) return;
        const res = await fetch(`/api/sms/templates/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Template deleted");
            onDeleted();
        } else toast.error("Delete failed");
    }

    const columns: DataTableColumn<SmsTemplateRow>[] = [
        { key: "name", header: "Name", cell: (r) => r.templateName },
        { key: "updated", header: "Updated", cell: (r) => new Date(r.updatedAt).toLocaleString() },
        {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (r) => (
                <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => onEdit(r)}>
                        Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(r._id)}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    if (loading) {
        return <p className="py-8 text-center text-muted-foreground">Loading...</p>;
    }

    return <DataTable rows={rows} rowKey={(r) => r._id} columns={columns} emptyMessage="No templates" />;
}
