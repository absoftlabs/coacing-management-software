// src/components/Teacher/AddTeacher.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AddTeacher() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [imageUrl, setImageUrl] = useState<string>("");

    function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) { setImageUrl(""); return; }
        const reader = new FileReader();
        reader.onload = () => setImageUrl(String(reader.result || ""));
        reader.readAsDataURL(f);
    }

    async function onSubmit(fd: FormData) {
        setSaving(true); setMsg("");
        const payload = {
            name: String(fd.get("name") || "").trim(),
            phone: String(fd.get("phone") || "").trim(),
            imageUrl,
            primarySubject: String(fd.get("primarySubject") || "").trim(),
            joinDate: String(fd.get("joinDate") || "") || undefined,
            salary: Number(fd.get("salary") || "") || undefined,
            isSuspended: false,
        };
        if (!payload.name || !payload.primarySubject) {
            setMsg("❌ Name & Primary Subject required");
            setSaving(false); return;
        }
        const res = await fetch("/api/teachers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            router.push("/teacher-list");
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({} as { error?: string }));
            setMsg("❌ " + (j.error || "Failed to add"));
            setSaving(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Add Teacher</h1>

            <form className="card bg-base-100 shadow-xl" action={async fd => onSubmit(fd)}>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control md:col-span-1">
                        <label className="mb-1 block text-sm font-medium">Teacher Name <span className="text-error">*</span></label>
                        <input name="name" required className="input input-bordered w-full" placeholder="e.g. Mr. Rahman" />
                    </div>
                    <div className="form-control md:col-span-1">
                        <label className="mb-1 block text-sm font-medium">Phone <span className="text-error">*</span></label>
                        <input name="phone" required className="input input-bordered w-full" placeholder="e.g. 017XXXXXXXX" />
                    </div>

                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Primary Subject <span className="text-error">*</span></label>
                        <input name="primarySubject" required className="input input-bordered w-full" placeholder="e.g. Physics" />
                    </div>

                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Join Date</label>
                        <input type="date" name="joinDate" className="input input-bordered w-full" />
                    </div>

                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Salary</label>
                        <input name="salary" inputMode="numeric" className="input input-bordered w-full" placeholder="e.g. 25000" />
                    </div>

                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Teacher Image (optional)</label>
                        <input type="file" accept="image/*" className="file-input file-input-bordered w-full" onChange={onPhoto} />
                        {imageUrl && (
                            <div className="mt-2">
                                <Image src={imageUrl} alt="preview" width={64} height={64}
                                    className="mask mask-squircle w-16 h-16 object-cover" />
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                        <a href="/teacher-list" className="btn btn-ghost">Cancel</a>
                        <button className="btn btn-primary" disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>

                    {msg && <div className="md:col-span-2 text-sm">{msg}</div>}
                </div>
            </form>
        </div>
    );
}
