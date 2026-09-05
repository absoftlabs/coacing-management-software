"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { IconPlus } from "@tabler/icons-react";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Row = {
    _id: string;
    name: string;
    code: string;
    teacher?: string;
    batch?: string;
    days?: string[];
    isActive?: boolean;
};

export default function ClassList({ rows }: { rows: Row[] }) {
    const [data, setData] = useState(rows);
    const confirm = useConfirm();

    async function onDelete(id: string) {
        const ok = await confirm({
            title: "Delete this class?",
            description: "This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });
        if (!ok) return;
        const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
        if (res.ok) {
            setData((prev) => prev.filter((x) => x._id !== id));
            toast.success("Class deleted");
        } else toast.error("Failed to delete");
    }

    const columns: DataTableColumn<Row>[] = [
        { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
        { key: "code", header: "Code", cell: (r) => r.code },
        { key: "teacher", header: "Teacher", cell: (r) => r.teacher || "-" },
        { key: "batch", header: "Batch", cell: (r) => r.batch || "-" },
        { key: "days", header: "Days", className: "whitespace-nowrap", cell: (r) => (r.days || []).join(", ") || "-" },
        {
            key: "status",
            header: "Status",
            cell: (r) => (
                <Badge variant={r.isActive ? "default" : "secondary"}>{r.isActive ? "Active" : "Inactive"}</Badge>
            ),
        },
        {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (r) => (
                <div className="flex justify-end gap-1.5">
                    <Link href={`/edit-class/${r._id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
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
        <DataTable
            rows={data}
            rowKey={(r) => r._id}
            columns={columns}
            searchPlaceholder="Search by name / code / teacher / batch"
            filterRow={(r, q) =>
                (r.name || "").toLowerCase().includes(q) ||
                (r.code || "").toLowerCase().includes(q) ||
                (r.teacher || "").toLowerCase().includes(q) ||
                (r.batch || "").toLowerCase().includes(q)
            }
            emptyMessage="No classes"
            toolbarRight={
                <Link href="/add-class" className={buttonVariants()}>
                    <IconPlus /> Add Class
                </Link>
            }
        />
    );
}
