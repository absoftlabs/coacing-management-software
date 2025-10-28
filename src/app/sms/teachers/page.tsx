// src/app/sms/teachers/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

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
    sentAt: string; // ISO
    error?: string;
};

export default function TeacherSmsPage() {
    const [teachers, setTeachers] = useState<TeacherRow[]>([]);
    const [scope, setScope] = useState<"ALL" | "INDIVIDUAL">("ALL");
    const [teacherId, setTeacherId] = useState<string>("");
    const [message, setMessage] = useState<string>("");

    const [sending, setSending] = useState(false);
    const [msg, setMsg] = useState<string>("");

    // logs
    const [logs, setLogs] = useState<SmsLogRow[]>([]);
    const [logQuery, setLogQuery] = useState<string>("");
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const list = await fetch("/api/teachers", { cache: "no-store" }).then(
                    (r) => r.json() as Promise<TeacherRow[]>
                );
                setTeachers(list);
            } catch {
                setTeachers([]);
            }
        })();
    }, []);

    async function send() {
        setSending(true);
        setMsg("");
        try {
            if (!message.trim()) {
                setMsg("Write a message first.");
                return;
            }
            if (scope === "INDIVIDUAL" && !teacherId) {
                setMsg("Select a teacher.");
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
                setMsg("✅ Sent");
                setMessage("");
                await loadLogs();
            } else {
                const j = (await res.json().catch(() => ({}))) as { error?: string };
                setMsg("❌ " + (j.error ?? "Failed to send"));
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
            const list = await fetch(url.toString(), { cache: "no-store" }).then(
                (r) => r.json() as Promise<SmsLogRow[]>
            );
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
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body space-y-6">
                <h2 className="card-title">Send SMS to Teachers</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Scope */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Select Teacher Scope *</span>
                        </label>
                        <select
                            className="select select-bordered rounded-full"
                            value={scope}
                            onChange={(e) => {
                                const v = e.target.value as "ALL" | "INDIVIDUAL";
                                setScope(v);
                                if (v === "ALL") setTeacherId("");
                            }}
                        >
                            <option value="ALL">All</option>
                            <option value="INDIVIDUAL">Individual Teacher</option>
                        </select>
                    </div>

                    {/* Pick teacher if INDIVIDUAL */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Teacher</span>
                        </label>
                        <select
                            className="select select-bordered rounded-full"
                            value={teacherId}
                            onChange={(e) => setTeacherId(e.target.value)}
                            disabled={scope !== "INDIVIDUAL"}
                        >
                            <option value="">-- Select Teacher --</option>
                            {teachers.map((t) => (
                                <option key={t._id} value={t._id}>
                                    {t.name}{t.primarySubject ? ` – ${t.primarySubject}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Message */}
                    <div className="form-control md:col-span-2">
                        <label className="label">
                            <span className="label-text">SMS *</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered rounded-2xl"
                            rows={4}
                            placeholder="Write your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <small className="opacity-60">
                            This message will be sent to {scope === "ALL" ? "all teachers" : "the selected teacher"}.
                        </small>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        className="btn btn-primary rounded-full"
                        onClick={send}
                        disabled={sending}
                    >
                        {sending ? "Sending..." : "Send"}
                    </button>
                </div>

                {msg && <div className="text-sm">{msg}</div>}

                {/* SMS LOG TABLE */}
                <div className="mt-6">
                    <div className="flex items-end justify-between gap-3 flex-col md:flex-row">
                        <h3 className="text-lg font-semibold">SMS Log (Teachers)</h3>
                        <div className="flex gap-2 items-center">
                            <input
                                className="input input-bordered rounded-full"
                                placeholder="Search logs (text / phone / teacher / status)"
                                value={logQuery}
                                onChange={(e) => setLogQuery(e.target.value)}
                            />
                            <button
                                className="btn btn-outline rounded-full"
                                onClick={loadLogs}
                                disabled={loadingLogs}
                            >
                                {loadingLogs ? "Refreshing..." : "Refresh"}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto mt-3">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>When</th>
                                    <th>Teacher</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Preview</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((l) => (
                                    <tr key={l._id}>
                                        <td>{new Date(l.sentAt).toLocaleString()}</td>
                                        <td>{l.teacherId ?? "-"}</td>
                                        <td className="font-mono">{l.phone}</td>
                                        <td>
                                            <span
                                                className={`badge ${l.status === "sent" ? "badge-success" : "badge-error"} text-white`}
                                            >
                                                {l.status}
                                            </span>
                                        </td>
                                        <td className="max-w-[520px] whitespace-normal">
                                            {l.preview}
                                        </td>
                                    </tr>
                                ))}
                                {!filteredLogs.length && (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center opacity-60">
                                            No logs
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* /LOG TABLE */}
            </div>
        </div>
    );
}
