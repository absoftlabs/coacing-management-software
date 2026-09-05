// src/app/sms/templates/page.tsx
"use client";

import { useEffect, useState } from "react";
import SmsTemplateForm, { type SmsTemplateShape } from "@/components/SMS/SmsTemplateForm";
import SmsTemplateList, { type SmsTemplateRow } from "@/components/SMS/SmsTemplateList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SmsTemplatesPage() {
    const [templates, setTemplates] = useState<SmsTemplateShape[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<SmsTemplateShape | null>(null);

    async function load() {
        setLoading(true);
        try {
            const res = await fetch("/api/sms/templates", { cache: "no-store" });
            if (res.ok) {
                const data: SmsTemplateShape[] = await res.json();
                setTemplates(data);
            } else {
                setTemplates([]);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>{editing ? "Edit Template" : "Create Template"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <SmsTemplateForm
                        initial={editing ?? undefined}
                        onSaved={() => {
                            setEditing(null);
                            load();
                        }}
                        onCancel={() => setEditing(null)}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>SMS Templates</CardTitle>
                </CardHeader>
                <CardContent>
                    <SmsTemplateList
                        rows={templates.filter((t): t is SmsTemplateRow => t._id !== undefined)}
                        loading={loading}
                        onEdit={(tpl) => setEditing(tpl)}
                        onDeleted={load}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
