// src/components/sms/SmsTemplateList.tsx
"use client";

export type SmsTemplateRow = {
    _id: string;
    templateName: string;
    templateBody: string;
    createdAt: string;
    updatedAt: string;
};

type Props = {
    rows: SmsTemplateRow[];
    loading?: boolean;
    onEdit: (tpl: SmsTemplateRow) => void;
    onDeleted: () => void;
};

export default function SmsTemplateList({ rows, loading, onEdit, onDeleted }: Props) {
    async function onDelete(id: string) {
        if (!confirm("Delete this template?")) return;
        const res = await fetch(`/api/sms/templates/${id}`, { method: "DELETE" });
        if (res.ok) onDeleted();
    }

    return (
        <div className="overflow-x-auto">
            <table className="table table-zebra">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Updated</th>
                        <th className="text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && (
                        <tr><td colSpan={3} className="text-center py-8 opacity-60">Loading...</td></tr>
                    )}
                    {!loading && rows.map(r => (
                        <tr key={r._id}>
                            <td>{r.templateName}</td>
                            <td>{new Date(r.updatedAt).toLocaleString()}</td>
                            <td className="text-right">
                                <div className="join">
                                    <button className="btn btn-sm join-item" onClick={() => onEdit(r)}>Edit</button>
                                    <button className="btn btn-sm btn-outline join-item" onClick={() => onDelete(r._id)}>Delete</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {!loading && !rows.length && (
                        <tr><td colSpan={3} className="text-center py-8 opacity-60">No templates</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
