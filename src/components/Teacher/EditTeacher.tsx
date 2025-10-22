// src/components/Teacher/EditTeacher.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { TeacherDoc } from "@/lib/types";

export default function EditTeacher({ item }: { item: TeacherDoc }) {
    const router = useRouter();
    const [msg, setMsg] = useState("");
    const [saving, setSaving] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>(item.imageUrl || "");

    function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) { setImageUrl(item.imageUrl || ""); return; }
        const reader = new FileReader();
        reader.onload = () => setImageUrl(String(reader.result || ""));
        reader.readAsDataURL(f);
    }

    async function onSubmit(fd: FormData) {
        setSaving(true); setMsg("");
        const payload = {
            name: String(fd.get("name") || "").trim(),
            imageUrl,
            primarySubject: String(fd.get("primarySubject") || "").trim(),
            joinDate: String(fd.get("joinDate") || "") || undefined,
            salary: Number(fd.get("salary") || "") || undefined,
        };
        if (!payload.name || !payload.primarySubject) {
            setMsg("❌ Name & Primary Subject required");
            setSaving(false); return;
        }
        const res = await fetch(`/api/teachers/${item._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            router.push("/teacher-list");
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({} as { error?: string }));
            setMsg("❌ " + (j.error || "Failed to update"));
            setSaving(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Edit Teacher</h1>

            <form className="card bg-base-100 shadow-xl" action={async fd => onSubmit(fd)}>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">Teacher Name <span className="text-error">*</span></label>
                        <input name="name" defaultValue={item.name} required className="input input-bordered w-full" />
                    </div>

                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Primary Subject <span className="text-error">*</span></label>
                        <input name="primarySubject" defaultValue={item.primarySubject} required className="input input-bordered w-full" />
                    </div>

                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Join Date</label>
                        <input type="date" name="joinDate" defaultValue={item.joinDate || ""} className="input input-bordered w-full" />
                    </div>

                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Salary</label>
                        <input name="salary" defaultValue={item.salary ?? ""} className="input input-bordered w-full" />
                    </div>

                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">Teacher Image</label>
                        <input type="file" accept="image/*" className="file-input file-input-bordered w-full" onChange={onPhoto} />
                        {(imageUrl || item.imageUrl) && (
                            <div className="mt-2">
                                <Image src={imageUrl || item.imageUrl || ""} alt="preview" width={64} height={64}
                                    className="mask mask-squircle w-16 h-16 object-cover" />
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                        <a href="/teacher-list" className="btn btn-ghost">Cancel</a>
                        <button className="btn btn-primary" disabled={saving}>
                            {saving ? "Saving..." : "Update"}
                        </button>
                    </div>

                    {msg && <div className="md:col-span-2 text-sm">{msg}</div>}
                </div>
            </form>
        </div>
    );
}
