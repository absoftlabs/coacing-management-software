// src/components/Attendance/MarkAttendance.tsx
"use client";

import { IconChecks, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

type StudentRow = {
    _id: string;
    studentId: string;
    name: string;
    batch: string;
};

type Props = {
    batches: string[];
};

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

export default function MarkAttendance({ batches }: Props) {
    const [batch, setBatch] = useState<string>("");
    const [date, setDate] = useState<string>(today());
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
    const [absentIds, setAbsentIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!batch) {
            setStudents([]);
            setPresentIds(new Set());
            setAbsentIds(new Set());
            return;
        }

        (async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/students?batch=${encodeURIComponent(batch)}`, { cache: "no-store" });
                const list = (await res.json()) as StudentRow[];
                setStudents(list);

                const attRes = await fetch(`/api/attendance?date=${date}`, { cache: "no-store" });
                const attList = (await attRes.json()) as Array<{ studentId: string; status: "Present" | "Absent" }>;

                const p = new Set<string>();
                const a = new Set<string>();
                for (const rec of attList) {
                    if (rec.status === "Present") p.add(rec.studentId);
                    if (rec.status === "Absent") a.add(rec.studentId);
                }
                setPresentIds(p);
                setAbsentIds(a);
            } catch {
                setStudents([]);
                setPresentIds(new Set());
                setAbsentIds(new Set());
            } finally {
                setLoading(false);
            }
        })();
    }, [batch, date]);

    async function mark(student: StudentRow, status: "Present" | "Absent") {
        const res = await fetch("/api/attendance", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                date,
                studentId: student.studentId,
                studentName: student.name,
                batch: student.batch,
                status,
            }),
        });

        if (!res.ok) {
            toast.error("Failed to save attendance");
            return;
        }

        setPresentIds((prev) => {
            const next = new Set(prev);
            if (status === "Present") next.add(student.studentId);
            else next.delete(student.studentId);
            return next;
        });
        setAbsentIds((prev) => {
            const next = new Set(prev);
            if (status === "Absent") next.add(student.studentId);
            else next.delete(student.studentId);
            return next;
        });
    }

    return (
        <Card>
            <CardContent>
                <div className="flex flex-wrap items-end gap-5">
                    <div className="space-y-2">
                        <Label>Batch</Label>
                        <Select value={batch} onValueChange={(v) => setBatch(v ?? "")}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="-- Select Batch --" />
                            </SelectTrigger>
                            <SelectContent>
                                {batches.map((b) => (
                                    <SelectItem key={b} value={b}>
                                        {b}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="attDate">Date</Label>
                        <Input id="attDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                </div>

                <div className="mt-4 overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Action</TableHead>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Name</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            )}

                            {!loading &&
                                students.map((s) => {
                                    const isP = presentIds.has(s.studentId);
                                    const isA = absentIds.has(s.studentId);
                                    return (
                                        <TableRow key={s._id}>
                                            <TableCell>
                                                <div className="flex gap-1.5">
                                                    <Button
                                                        size="icon-sm"
                                                        variant={isP ? "default" : "outline"}
                                                        title="Mark Present"
                                                        onClick={() => mark(s, "Present")}
                                                    >
                                                        <IconChecks className="size-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon-sm"
                                                        variant={isA ? "destructive" : "outline"}
                                                        title="Mark Absent"
                                                        onClick={() => mark(s, "Absent")}
                                                    >
                                                        <IconX className="size-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono">{s.studentId}</TableCell>
                                            <TableCell>{s.name}</TableCell>
                                        </TableRow>
                                    );
                                })}

                            {!loading && students.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        No students
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
