// src/app/sms/templates/page.tsx
"use client";

import SmsTemplateForm, { SmsTemplateShape } from "@/components/SMS/SmsTemplateForm";
import SmsTemplateList, { SmsTemplateRow } from "@/components/SMS/SmsTemplateList";
import { useEffect, useState } from "react";

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

    useEffect(() => { load(); }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">{editing ? "Edit Template" : "Create Template"}</h2>
                    <SmsTemplateForm
                        initial={editing ?? undefined}
                        onSaved={() => { setEditing(null); load(); }}
                        onCancel={() => setEditing(null)}
                    />
                </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">SMS Templates</h2>
                    <SmsTemplateList
                        rows={templates.filter((t): t is SmsTemplateRow => t._id !== undefined)}
                        loading={loading}
                        onEdit={(tpl) => setEditing(tpl)}
                        onDeleted={load}
                    />
                </div>
            </div>
        </div>
    );
}
