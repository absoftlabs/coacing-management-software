// src/components/Fees/EditFeeForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FeeDoc } from "@/lib/types";

export default function EditFeeForm({ initial }: { initial: FeeDoc }) {
    const router = useRouter();
    const [msg, setMsg] = useState<string>("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(fd: FormData) {
        setLoading(true);
        setMsg("");

        const payload = {
            studentId: String(fd.get("studentId") || "").trim(),
            studentName: String(fd.get("studentName") || "").trim(),
            depositBy: String(fd.get("depositBy") || "").trim(),
            receivedBy: String(fd.get("receivedBy") || "").trim(),
            amount: Number(fd.get("amount") || 0),
        };

        if (!payload.studentId || !payload.studentName || !payload.depositBy || !payload.receivedBy || !payload.amount) {
            setMsg("❌ All fields are required");
            setLoading(false);
            return;
        }

        const res = await fetch(`/api/fees/${initial._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            setMsg("✅ Updated");
            router.push("/fees-list"); // আপনার লিস্ট রুট যদি আলাদা হয়, সেটি দিন
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({} as { error?: string }));
            setMsg("❌ " + (j.error || "Failed to update"));
        }
        setLoading(false);
    }

    return (
        <form className="card bg-base-100 shadow-xl" action={async (fd) => onSubmit(fd)}>
            <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                    <label className="label"><span className="label-text">Student ID *</span></label>
                    <input name="studentId" defaultValue={initial.studentId} required className="input input-bordered" />
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Student Name *</span></label>
                    <input name="studentName" defaultValue={initial.studentName} required className="input input-bordered" />
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Deposit By *</span></label>
                    <input name="depositBy" defaultValue={initial.depositBy} required className="input input-bordered" />
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Received By *</span></label>
                    <input name="receivedBy" defaultValue={initial.receivedBy} required className="input input-bordered" />
                </div>

                <div className="form-control md:col-span-2">
                    <label className="label"><span className="label-text">Amount *</span></label>
                    <input name="amount" type="number" min={0} step="1" defaultValue={initial.amount} required className="input input-bordered" />
                </div>
            </div>

            <div className="card-actions justify-end p-6 pt-0">
                <a href="/fees-list" className="btn btn-ghost">Cancel</a>
                <button className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : "Update"}
                </button>
            </div>

            {msg && <div className="px-6 pb-6 -mt-2 text-sm">{msg}</div>}
        </form>
    );
}
