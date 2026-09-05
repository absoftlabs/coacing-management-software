"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AttendanceDoc } from "@/app/api/attendance/route";
import { IconChecks, IconX } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type Props = {
    kind: "Present" | "Absent";
    title: string;
};

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

type BatchApiRow = string | { name?: string | null; _id?: string | null };

export default function StatusList({ kind, title }: Props) {
    const [date, setDate] = useState<string>(today());
    const [batch, setBatch] = useState<string>("all");
    const [batches, setBatches] = useState<string[]>([]);
    const [rows, setRows] = useState<Array<AttendanceDoc & { _id: string }>>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingBatches, setLoadingBatches] = useState<boolean>(true);

    useEffect(() => {
        async function loadBatches() {
            try {
                const res = await fetch("/api/batches", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load batches");
                const raw: unknown = await res.json();
                const arr = Array.isArray(raw) ? (raw as BatchApiRow[]) : [];
                const names = arr
                    .map((item) => (typeof item === "string" ? item : item?.name ?? ""))
                    .filter((s): s is string => typeof s === "string" && s.length > 0);
                setBatches(names);
            } catch {
                setBatches([]);
            } finally {
                setLoadingBatches(false);
            }
        }
        void loadBatches();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const params = new URLSearchParams({ date, status: kind });
            if (batch !== "all") params.append("batch", batch);

            const res = await fetch(`/api/attendance?${params.toString()}`, { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch attendance");

            const list = (await res.json()) as Array<AttendanceDoc & { _id: string }>;
            setRows(list);
        } catch {
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, kind, batch]);

    async function toggle(row: AttendanceDoc & { _id: string }) {
        const next: "Present" | "Absent" = kind === "Present" ? "Absent" : "Present";
        const res = await fetch("/api/attendance", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                date,
                studentId: row.studentId,
                studentName: row.studentName,
                batch: row.batch,
                status: next,
            }),
        });
        if (!res.ok) {
            toast.error("Failed to update attendance");
            return;
        }
        await load();
    }

    return (
        <Card>
            <CardContent>
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <h2 className="text-lg font-semibold">{title}</h2>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Label className="whitespace-nowrap">Batch</Label>
                            {loadingBatches ? (
                                <Skeleton className="h-9 w-32" />
                            ) : (
                                <Select value={batch} onValueChange={(v) => setBatch(v ?? "all")}>
                                    <SelectTrigger className="w-36">
                                        <SelectValue />
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
                        </div>

                        <div className="flex items-center gap-2">
                            <Label htmlFor={`date-${kind}`} className="whitespace-nowrap">
                                Date
                            </Label>
                            <Input id={`date-${kind}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
                        </div>
                    </div>
                </div>

                <div className="mt-4 overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Action</TableHead>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Batch</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            )}

                            {!loading &&
                                rows.map((r) => (
                                    <TableRow key={r._id}>
                                        <TableCell>
                                            {kind === "Present" ? (
                                                <Button size="icon-sm" variant="destructive" title="Mark Absent" onClick={() => toggle(r)}>
                                                    <IconX className="size-3.5" />
                                                </Button>
                                            ) : (
                                                <Button size="icon-sm" title="Mark Present" onClick={() => toggle(r)}>
                                                    <IconChecks className="size-3.5" />
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono">{r.studentId}</TableCell>
                                        <TableCell>{r.studentName}</TableCell>
                                        <TableCell>{r.batch}</TableCell>
                                    </TableRow>
                                ))}

                            {!loading && !rows.length && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No records found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
