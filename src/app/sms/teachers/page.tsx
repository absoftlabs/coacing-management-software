// src/app/sms/teachers/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type TeacherRow = {
    _id: string;
    name: string;
    phone?: string;
    primarySubject?: string;
};

type SmsLogRow = {
    _id: string;
    audience: "student" | "teacher";
    teacherId?: string;
    preview: string;
    phone: string;
    status: "sent" | "failed" | string;
    providerId?: string;
    sentAt: string;
    error?: string;
};

export default function TeacherSmsPage() {
    const [teachers, setTeachers] = useState<TeacherRow[]>([]);
    const [scope, setScope] = useState<"ALL" | "INDIVIDUAL">("ALL");
    const [teacherId, setTeacherId] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [sending, setSending] = useState(false);

    const [logs, setLogs] = useState<SmsLogRow[]>([]);
    const [logQuery, setLogQuery] = useState<string>("");
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const list = await fetch("/api/teachers", { cache: "no-store" }).then((r) => r.json() as Promise<TeacherRow[]>);
                setTeachers(list);
            } catch {
                setTeachers([]);
            }
        })();
    }, []);

    async function send() {
        setSending(true);
        try {
            if (!message.trim()) {
                toast.error("Write a message first.");
                return;
            }
            if (scope === "INDIVIDUAL" && !teacherId) {
                toast.error("Select a teacher.");
                return;
            }

            const payload = {
                teacher_scope: scope,
                teacher_id: scope === "INDIVIDUAL" ? teacherId : undefined,
                custom_sms: message,
            };

            const res = await fetch("/api/sms/send/teacher", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("Sent");
                setMessage("");
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
            url.searchParams.set("audience", "teacher");
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
    }, []);

    const filteredLogs = useMemo(() => {
        const s = logQuery.trim().toLowerCase();
        if (!s) return logs;
        return logs.filter(
            (l) =>
                (l.preview ?? "").toLowerCase().includes(s) ||
                (l.phone ?? "").toLowerCase().includes(s) ||
                (l.teacherId ?? "").toLowerCase().includes(s) ||
                (l.status ?? "").toLowerCase().includes(s)
        );
    }, [logs, logQuery]);

    return (
        <Card>
            <CardContent className="space-y-6">
                <h2 className="text-lg font-semibold">Send SMS to Teachers</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Select Teacher Scope *</Label>
                        <Select
                            value={scope}
                            onValueChange={(v) => {
                                const val = (v ?? "ALL") as "ALL" | "INDIVIDUAL";
                                setScope(val);
                                if (val === "ALL") setTeacherId("");
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All</SelectItem>
                                <SelectItem value="INDIVIDUAL">Individual Teacher</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Teacher</Label>
                        <Select value={teacherId} onValueChange={(v) => setTeacherId(v ?? "")} disabled={scope !== "INDIVIDUAL"}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="-- Select Teacher --" />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map((t) => (
                                    <SelectItem key={t._id} value={t._id}>
                                        {t.name}
                                        {t.primarySubject ? ` – ${t.primarySubject}` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="message">SMS *</Label>
                        <Textarea
                            id="message"
                            rows={4}
                            placeholder="Write your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            This message will be sent to {scope === "ALL" ? "all teachers" : "the selected teacher"}.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={send} disabled={sending}>
                        {sending ? "Sending..." : "Send"}
                    </Button>
                </div>

                <div className="space-y-3">
                    <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
                        <h3 className="text-lg font-semibold">SMS Log (Teachers)</h3>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Search logs (text / phone / teacher / status)"
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
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Preview</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map((l) => (
                                    <TableRow key={l._id}>
                                        <TableCell>{new Date(l.sentAt).toLocaleString()}</TableCell>
                                        <TableCell>{l.teacherId ?? "-"}</TableCell>
                                        <TableCell className="font-mono">{l.phone}</TableCell>
                                        <TableCell>
                                            <Badge variant={l.status === "sent" ? "default" : "destructive"}>{l.status}</Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[520px] whitespace-normal">{l.preview}</TableCell>
                                    </TableRow>
                                ))}
                                {!filteredLogs.length && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
