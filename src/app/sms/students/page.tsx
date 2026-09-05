// src/app/sms/students/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ORG_NAME } from "@/lib/org";

type BatchRow = { _id: string; name: string };
type TemplateRow = {
    _id: string;
    templateName: string;
    templateBody: string;
    createdAt: string;
    updatedAt: string;
};
type ResultRow = {
    _id: string;
    batch: string;
    studentId?: string;
    studentName?: string;
    resultType: string;
    examDate?: string;
    subjects: Array<{
        className: string;
        mcqTotal?: number;
        mcqGain?: number;
        quesTotal?: number;
        quesGain?: number;
        totalMarks?: number;
        totalGain?: number;
    }>;
    totalMarks?: number;
    totalGain?: number;
    createdAt: string;
    updatedAt: string;
};
type StudentRow = {
    _id: string;
    studentId: string;
    name: string;
    batch: string;
    guardianPhone?: string;
    roll?: string;
};

type SmsLogRow = {
    _id: string;
    audience: "student" | "teacher";
    batchId?: string;
    studentId?: string;
    teacherId?: string;
    templateId?: string;
    preview: string;
    phone: string;
    status: "sent" | "failed" | string;
    providerId?: string;
    sentAt: string;
    error?: string;
};

const RESULT_TYPES = ["Class Test", "Weekly Test", "Quiz Test", "Model Test", "Custom"];

export default function StudentSmsPage() {
    const [batches, setBatches] = useState<BatchRow[]>([]);
    const [templates, setTemplates] = useState<TemplateRow[]>([]);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [results, setResults] = useState<ResultRow[]>([]);

    const [batch, setBatch] = useState<string>("");
    const [studentId, setStudentId] = useState<string>("all");
    const [qStudent, setQStudent] = useState<string>("");
    const [templateId, setTemplateId] = useState<string>("");
    const [resultType, setResultType] = useState<string>("");
    const [resultId, setResultId] = useState<string>("");
    const [sending, setSending] = useState(false);

    const [logs, setLogs] = useState<SmsLogRow[]>([]);
    const [logQuery, setLogQuery] = useState<string>("");
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [b, t] = await Promise.all([
                    fetch("/api/batches", { cache: "no-store" }).then((r) => r.json() as Promise<BatchRow[]>),
                    fetch("/api/sms/templates", { cache: "no-store" }).then((r) => r.json() as Promise<TemplateRow[]>),
                ]);
                setBatches(b);
                setTemplates(t);
            } catch {
                setBatches([]);
                setTemplates([]);
            }
        })();
    }, []);

    useEffect(() => {
        if (!batch) {
            setStudents([]);
            return;
        }
        (async () => {
            try {
                const url = qStudent
                    ? `/api/students?q=${encodeURIComponent(qStudent)}&batch=${encodeURIComponent(batch)}`
                    : `/api/students?batch=${encodeURIComponent(batch)}`;
                const st = await fetch(url, { cache: "no-store" }).then((r) => r.json() as Promise<StudentRow[]>);
                setStudents(st);
            } catch {
                setStudents([]);
            }
        })();
    }, [batch, qStudent]);

    useEffect(() => {
        if (!batch || !resultType) {
            setResults([]);
            return;
        }
        (async () => {
            try {
                const url = new URL("/api/results", location.origin);
                url.searchParams.set("batch", batch);
                url.searchParams.set("resultType", resultType);
                if (studentId !== "all") url.searchParams.set("studentId", studentId);
                const data = await fetch(url.toString(), { cache: "no-store" }).then((r) => r.json() as Promise<ResultRow[]>);
                setResults(data.slice(0, 20));
            } catch {
                setResults([]);
            }
        })();
    }, [batch, resultType, studentId]);

    const studentsInBatch = useMemo(() => students.filter((s) => s.batch === batch), [students, batch]);

    async function send() {
        setSending(true);
        try {
            if (!batch || !templateId || !resultId) {
                toast.error("Select batch, template and result.");
                return;
            }
            const payload = {
                batchId: batch,
                studentId: studentId === "all" ? undefined : studentId,
                templateId,
                resultId,
                coachingName: ORG_NAME,
            };
            const res = await fetch("/api/sms/send/student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                toast.success("Sent");
                await loadLogs();
            } else {
                const j = (await res.json().catch(() => ({}))) as { error?: string };
                toast.error(j.error ?? "Failed to send");
            }
        } finally {
            setSending(false);
        }
    }

    async function loadLogs() {
        setLoadingLogs(true);
        try {
            const url = new URL("/api/sms/logs", location.origin);
            url.searchParams.set("audience", "student");
            if (batch) url.searchParams.set("batchId", batch);
            const list = await fetch(url.toString(), { cache: "no-store" }).then((r) => r.json() as Promise<SmsLogRow[]>);
            setLogs(list);
        } catch {
            setLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    }

    useEffect(() => {
        loadLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredLogs = useMemo(() => {
        const s = logQuery.trim().toLowerCase();
        if (!s) return logs;
        return logs.filter(
            (l) =>
                (l.preview ?? "").toLowerCase().includes(s) ||
                (l.phone ?? "").toLowerCase().includes(s) ||
                (l.studentId ?? "").toLowerCase().includes(s) ||
                (l.batchId ?? "").toLowerCase().includes(s) ||
                (l.status ?? "").toLowerCase().includes(s)
        );
    }, [logs, logQuery]);

    return (
        <Card>
            <CardContent className="space-y-6">
                <h2 className="text-lg font-semibold">Send SMS to Students / Guardians</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                        <Label>Batch *</Label>
                        <Select
                            value={batch}
                            onValueChange={(v) => {
                                setBatch(v ?? "");
                                setStudentId("all");
                                setResultId("");
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="-- Select Batch --" />
                            </SelectTrigger>
                            <SelectContent>
                                {batches.map((b) => (
                                    <SelectItem key={b._id} value={b.name}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>SMS Template *</Label>
                        <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? "")}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="-- Select Template --" />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map((t) => (
                                    <SelectItem key={t._id} value={t._id}>
                                        {t.templateName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Student (Optional)</Label>
                        <div className="flex gap-2">
                            <Input placeholder="Search by name or ID" value={qStudent} onChange={(e) => setQStudent(e.target.value)} />
                            <Select
                                value={studentId}
                                onValueChange={(v) => {
                                    setStudentId(v ?? "all");
                                    setResultId("");
                                }}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All in Batch</SelectItem>
                                    {studentsInBatch.map((s) => (
                                        <SelectItem key={s._id} value={s.studentId}>
                                            {s.name} ({s.studentId})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">Leave blank to send to all guardians in the selected batch.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Result Type *</Label>
                        <Select
                            value={resultType}
                            onValueChange={(v) => {
                                setResultType(v ?? "");
                                setResultId("");
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="-- Select --" />
                            </SelectTrigger>
                            <SelectContent>
                                {RESULT_TYPES.map((rt) => (
                                    <SelectItem key={rt} value={rt}>
                                        {rt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label>Select Result *</Label>
                        <Select value={resultId} onValueChange={(v) => setResultId(v ?? "")}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="-- Select Result --" />
                            </SelectTrigger>
                            <SelectContent>
                                {results.map((r) => (
                                    <SelectItem key={r._id} value={r._id}>
                                        {r.studentName ? `${r.studentName} – ` : ""}
                                        {r.resultType} – {r.examDate ?? "-"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Shows recent results filtered by batch/student/type.</p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={send} disabled={sending}>
                        {sending ? "Sending..." : "Send"}
                    </Button>
                </div>

                <div className="space-y-3">
                    <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
                        <h3 className="text-lg font-semibold">SMS Log (Students)</h3>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Search logs (text / phone / student / batch)"
                                value={logQuery}
                                onChange={(e) => setLogQuery(e.target.value)}
                            />
                            <Button variant="outline" onClick={loadLogs} disabled={loadingLogs}>
                                {loadingLogs ? "Refreshing..." : "Refresh"}
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>When</TableHead>
                                    <TableHead>Batch</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Preview</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map((l) => (
                                    <TableRow key={l._id}>
                                        <TableCell>{new Date(l.sentAt).toLocaleString()}</TableCell>
                                        <TableCell>{l.batchId ?? "-"}</TableCell>
                                        <TableCell>{l.studentId ?? "-"}</TableCell>
                                        <TableCell className="font-mono">{l.phone}</TableCell>
                                        <TableCell>
                                            <Badge variant={l.status === "sent" ? "default" : "destructive"}>{l.status}</Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[520px] whitespace-normal">{l.preview}</TableCell>
                                    </TableRow>
                                ))}
                                {!filteredLogs.length && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No logs
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
