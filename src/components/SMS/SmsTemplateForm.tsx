// src/components/sms/SmsTemplateForm.tsx
"use client";

import { useEffect, useState } from "react";

export type SmsTemplateShape = {
    _id?: string;
    templateName: string;
    templateBody: string;
    createdAt?: string;
    updatedAt?: string;
};

type Props = {
    initial?: SmsTemplateShape;
    onSaved: () => void;
    onCancel?: () => void;
};

const PLACEHOLDERS: Array<{ key: string; label: string; example?: string }> = [
    { key: "[coaching-name]", label: "Coaching Name", example: "Bright Future Coaching" },
    { key: "[student-name]", label: "Student Name", example: "Arif Hasan" },
    { key: "[student-id]", label: "Student ID", example: "STU-2025-0193" },
    { key: "[student-roll]", label: "Student Roll", example: "42" },
    { key: "[gain-mark/total-mark]", label: "Gain/Total Marks", example: "85/100" },
    { key: "[exam-type]", label: "Exam Type", example: "Midterm" },
    { key: "[exam-date]", label: "Exam Date", example: "2025-10-27" },
    { key: "[subject]", label: "Single Subject", example: "Physics" },
    { key: "[subjects]", label: "Multiple Subjects", example: "Physics-50/100, Chemistry-70/100" },
];

export default function SmsTemplateForm({ initial, onSaved, onCancel }: Props) {
    const [templateName, setTemplateName] = useState<string>("");
    const [templateBody, setTemplateBody] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string>("");

    useEffect(() => {
        if (initial) {
            setTemplateName(initial.templateName);
            setTemplateBody(initial.templateBody);
        } else {
            setTemplateName("");
            setTemplateBody("");
        }
        setMsg("");
    }, [initial]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMsg("");

        const payload = { templateName: templateName.trim(), templateBody: templateBody.trim() };
        const path = initial?._id ? `/api/sms/templates/${initial._id}` : "/api/sms/templates";
        const method = initial?._id ? "PUT" : "POST";

        const res = await fetch(path, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            onSaved();
            setTemplateName("");
            setTemplateBody("");
        } else {
            const j = await res.json().catch(() => ({} as { error?: string }));
            setMsg("Failed: " + (j.error ?? "Unknown error"));
        }
        setSaving(false);
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="form-control">
                <label className="label"><span className="label-text">Template Name</span></label>
                <input
                    className="input input-bordered"
                    required
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Result Notice - Midterm"
                />
            </div>

            <div className="form-control">
                <label className="label"><span className="label-text">SMS Template</span></label>
                <textarea
                    className="textarea textarea-bordered min-h-36"
                    required
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    placeholder="Dear [student-name], your [exam-type] result is [gain-mark/total-mark] in [subject] on [exam-date]. – [coaching-name]"
                />
                <div className="mt-2 text-xs">
                    <div className="font-semibold mb-1">Available Variables:</div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {PLACEHOLDERS.map(p => (
                            <div key={p.key} className="p-2 rounded bg-base-200">
                                <div className="font-mono text-xs">{p.key}</div>
                                <div className="opacity-70">{p.label}{p.example ? ` – e.g. ${p.example}` : ""}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-2 justify-end">
                {onCancel && (
                    <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
                )}
                <button className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : initial?._id ? "Update Template" : "Save Template"}
                </button>
            </div>

            {msg && <div className="text-sm">{msg}</div>}
        </form>
    );
}
