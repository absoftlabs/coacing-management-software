// src/components/SMS/SmsTemplateForm.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

    useEffect(() => {
        if (initial) {
            setTemplateName(initial.templateName);
            setTemplateBody(initial.templateBody);
        } else {
            setTemplateName("");
            setTemplateBody("");
        }
    }, [initial]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const payload = { templateName: templateName.trim(), templateBody: templateBody.trim() };
        const path = initial?._id ? `/api/sms/templates/${initial._id}` : "/api/sms/templates";
        const method = initial?._id ? "PUT" : "POST";

        const res = await fetch(path, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            toast.success(initial?._id ? "Template updated" : "Template saved");
            onSaved();
            setTemplateName("");
            setTemplateBody("");
        } else {
            const j = await res.json().catch(() => ({} as { error?: string }));
            toast.error("Failed: " + (j.error ?? "Unknown error"));
        }
        setSaving(false);
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                    id="templateName"
                    required
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Result Notice - Midterm"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="templateBody">SMS Template</Label>
                <Textarea
                    id="templateBody"
                    required
                    className="min-h-36"
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    placeholder="Dear [student-name], your [exam-type] result is [gain-mark/total-mark] in [subject] on [exam-date]. – [coaching-name]"
                />
                <div className="text-xs">
                    <div className="mb-1 font-semibold">Available Variables:</div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {PLACEHOLDERS.map((p) => (
                            <div key={p.key} className="rounded-md border bg-muted/40 p-2">
                                <div className="font-mono text-xs">{p.key}</div>
                                <div className="text-muted-foreground">
                                    {p.label}
                                    {p.example ? ` – e.g. ${p.example}` : ""}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : initial?._id ? "Update Template" : "Save Template"}
                </Button>
            </div>
        </form>
    );
}
