// src/app/sms/teachers/page.tsx
"use client";

import { useEffect, useState } from "react";

type TeacherRow = { _id: string; name: string; phone?: string };

export default function TeacherSmsPage() {
    const [teachers, setTeachers] = useState<TeacherRow[]>([]);
    const [scope, setScope] = useState<"ALL" | "INDIVIDUAL">("ALL");
    const [teacherId, setTeacherId] = useState<string>("");
    const [text, setText] = useState<string>("");
    const [sending, setSending] = useState(false);
    const [msg, setMsg] = useState<string>("");

    useEffect(() => {
        (async () => {
            try {
                const list: TeacherRow[] = await fetch("/api/teachers", { cache: "no-store" }).then(r => r.json());
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
            if (!text.trim()) {
                setMsg("Write your message.");
                setSending(false);
                return;
            }
            const payload = {
                scope,
                teacherId: scope === "INDIVIDUAL" ? teacherId : undefined,
                text: text.trim(),
            };
            const res = await fetch("/api/sms/send/teacher", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) setMsg("✅ Sent");
            else {
                const j = await res.json().catch(() => ({} as { error?: string }));
                setMsg("❌ " + (j.error ?? "Failed to send"));
            }
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body space-y-4">
                <h2 className="card-title">Send SMS to Teachers</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Scope</span></label>
                        <select className="select select-bordered" value={scope} onChange={(e) => setScope(e.target.value as "ALL" | "INDIVIDUAL")}>
                            <option value="ALL">All</option>
                            <option value="INDIVIDUAL">Individual Teacher</option>
                        </select>
                    </div>

                    {scope === "INDIVIDUAL" && (
                        <div className="form-control">
                            <label className="label"><span className="label-text">Teacher</span></label>
                            <select className="select select-bordered" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                                <option value="">-- Select --</option>
                                {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="form-control md:col-span-2">
                        <label className="label"><span className="label-text">Message</span></label>
                        <textarea className="textarea textarea-bordered min-h-32" value={text} onChange={(e) => setText(e.target.value)} />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button className="btn btn-primary" onClick={send} disabled={sending}>
                        {sending ? "Sending..." : "Send"}
                    </button>
                </div>

                {msg && <div className="text-sm">{msg}</div>}
            </div>
        </div>
    );
}
