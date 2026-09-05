// src/components/Teacher/TeacherList.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { IconCopy, IconPlus } from "@tabler/icons-react";
import type { TeacherDoc } from "@/lib/types";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type Credentials = { username: string; password: string };

export type TeacherRow = TeacherDoc & { totalAssignedClass?: number };

function initials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");
}

export default function TeacherList({
    rows,
    suspendedOnly = false,
}: {
    rows: TeacherRow[];
    suspendedOnly?: boolean;
}) {
    const [data, setData] = useState<TeacherRow[]>(rows);
    const [credentials, setCredentials] = useState<Credentials | null>(null);
    const confirm = useConfirm();

    function copyCredentials() {
        if (!credentials) return;
        navigator.clipboard
            .writeText(`Username: ${credentials.username}\nPassword: ${credentials.password}`)
            .then(() => toast.success("Copied to clipboard"))
            .catch(() => toast.error("Copy failed"));
    }

    async function onResetPassword(id?: string, name?: string) {
        if (!id) return;
        const ok = await confirm({
            title: "Reset login password?",
            description: `${name ?? "This teacher"}'s password will be reset to the default (123456). The old one stops working immediately.`,
            confirmText: "Reset",
        });
        if (!ok) return;
        const res = await fetch(`/api/teachers/${id}/reset-password`, { method: "POST" });
        if (res.ok) {
            setCredentials(await res.json());
        } else {
            toast.error("Failed to reset password");
        }
    }

    const scoped = data.filter((r) => (suspendedOnly ? r.isSuspended === true : r.isSuspended !== true));

    async function onDelete(id?: string) {
        if (!id) return;
        const ok = await confirm({
            title: "Delete this teacher?",
            description: "This action cannot be undone.",
            confirmText: "Delete",
            variant: "destructive",
        });
        if (!ok) return;
        const res = await fetch(`/api/teachers/${id}`, { method: "DELETE" });
        if (res.ok) {
            setData((prev) => prev.filter((x) => x._id !== id));
            toast.success("Teacher deleted");
        } else toast.error("Delete failed");
    }

    async function onToggleSuspend(id?: string, suspend?: boolean) {
        if (!id) return;
        const ok = await confirm({ title: suspend ? "Suspend this teacher?" : "Re-appoint this teacher?" });
        if (!ok) return;
        const res = await fetch(`/api/teachers/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isSuspended: suspend }),
        });
        if (res.ok) {
            setData((prev) => prev.map((x) => (x._id === id ? { ...x, isSuspended: suspend } : x)));
            toast.success(suspend ? "Teacher suspended" : "Teacher re-appointed");
        } else toast.error("Action failed");
    }

    const columns: DataTableColumn<TeacherRow>[] = [
        {
            key: "photo",
            header: "",
            cell: (r) => (
                <Avatar className="size-9 rounded-md">
                    <AvatarImage src={r.imageUrl} alt={r.name} />
                    <AvatarFallback className="rounded-md">{initials(r.name)}</AvatarFallback>
                </Avatar>
            ),
        },
        { key: "name", header: "Name", cell: (r) => r.name },
        { key: "phone", header: "Phone", cell: (r) => r.phone },
        { key: "subject", header: "Primary Subject", cell: (r) => r.primarySubject },
        { key: "classes", header: "Assigned Classes", cell: (r) => r.totalAssignedClass ?? 0 },
        { key: "joinDate", header: "Join Date", cell: (r) => r.joinDate || "-" },
        { key: "salary", header: "Salary", cell: (r) => (r.salary !== undefined ? r.salary : "-") },
        {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (r) => (
                <div className="flex justify-end gap-1.5">
                    <Link href={`/edit-teacher/${r._id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Edit
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => onResetPassword(r._id, r.name)}>
                        Reset Password
                    </Button>
                    {!suspendedOnly ? (
                        <Button size="sm" variant="secondary" onClick={() => onToggleSuspend(r._id, true)}>
                            Suspend
                        </Button>
                    ) : (
                        <Button size="sm" onClick={() => onToggleSuspend(r._id, false)}>
                            Appoint
                        </Button>
                    )}
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
                rowKey={(r) => r._id ?? r.name}
                columns={columns}
                searchPlaceholder="Search by name/subject"
                filterRow={(r, q) => r.name.toLowerCase().includes(q) || (r.primarySubject || "").toLowerCase().includes(q)}
                emptyMessage="No teachers"
                toolbarRight={
                    !suspendedOnly && (
                        <Link href="/add-teacher" className={buttonVariants()}>
                            <IconPlus /> Add Teacher
                        </Link>
                    )
                }
            />

            <Dialog open={!!credentials} onOpenChange={(open) => !open && setCredentials(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Password reset</DialogTitle>
                        <DialogDescription>
                            The login has been reset to the default password below. Ask the teacher to change it
                            from Change Password after logging in.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Username</Label>
                            <Input readOnly value={credentials?.username ?? ""} className="font-mono" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Password</Label>
                            <Input readOnly value={credentials?.password ?? ""} className="font-mono" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={copyCredentials}>
                            <IconCopy className="size-4" /> Copy
                        </Button>
                        <Button onClick={() => setCredentials(null)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
