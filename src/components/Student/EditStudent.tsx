// components/Student/EditStudent.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Batch = { _id: string; name: string };
type Item = any;

const DIVISIONS = ["Science", "Humanities", "Commerce"] as const;
const SECTIONS = ["A", "B", "C", "D"] as const;

export default function EditStudent({ item }: { item: Item }) {
    const router = useRouter();
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [batches, setBatches] = useState<Batch[]>([]);

    // guardian states (keep labels on top; auto-fill like Add form)
    const [guardianMode, setGuardianMode] = useState<"Father" | "Mother" | "Custom">(() => {
        if (item.guardianName && item.guardianName === item.fatherName) return "Father";
        if (item.guardianName && item.guardianName === item.motherName) return "Mother";
        return "Custom";
    });
    const [fatherName, setFatherName] = useState(item.fatherName || "");
    const [motherName, setMotherName] = useState(item.motherName || "");
    const [customGuardian, setCustomGuardian] = useState(
        () => (guardianMode === "Custom" ? item.guardianName || "" : "")
    );

    // photo (optional) — keep consistent with Add form
    const [photoUrl, setPhotoUrl] = useState<string>(item.photoUrl || "");

    const resolvedGuardianName = useMemo(() => {
        if (guardianMode === "Father") return fatherName.trim();
        if (guardianMode === "Mother") return motherName.trim();
        return customGuardian.trim();
    }, [guardianMode, fatherName, motherName, customGuardian]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/batches");
                const data = await res.json();
                setBatches(data);
            } catch { }
        })();
    }, []);

    function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) { setPhotoUrl(""); return; }
        const reader = new FileReader();
        reader.onload = () => setPhotoUrl(String(reader.result || ""));
        reader.readAsDataURL(file);
    }

    async function onSubmit(fd: FormData) {
        setLoading(true);
        setMsg("");

        const payload = {
            name: String(fd.get("name") || "").trim(),
            batch: String(fd.get("batch") || "").trim(),
            roll: String(fd.get("roll") || "").trim(),
            division: (String(fd.get("division") || "") || undefined) as any,
            schoolName: String(fd.get("schoolName") || ""),
            schoolRoll: String(fd.get("schoolRoll") || ""),
            schoolSection: (String(fd.get("schoolSection") || "") || undefined) as any,
            address: String(fd.get("address") || ""),
            fatherName: fatherName.trim(),
            motherName: motherName.trim(),
            guardianName: resolvedGuardianName,
            guardianPhone: String(fd.get("guardianPhone") || ""),
            gender: (String(fd.get("gender") || "") || undefined) as any,
            photoUrl, // keep/update photo
        };

        const res = await fetch(`/api/students/${item._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            setMsg("✅ Updated");
            router.push("/student-list");
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({}));
            setMsg("❌ " + (j.error || "Failed to update"));
        }
        setLoading(false);
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Edit Student</h1>
            <div className="text-sm opacity-70">
                Student ID: <span className="font-mono">{item.studentId}</span>
            </div>

            <form className="card bg-base-100 shadow-xl" action={async (fd) => onSubmit(fd)}>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">নাম *</label>
                        <input name="name" defaultValue={item.name} required className="input input-bordered w-full" />
                    </div>

                    {/* Batch */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">ব্যাচ *</label>
                        <select name="batch" defaultValue={item.batch} required className="select select-bordered w-full">
                            <option value="">-- Select Batch --</option>
                            {batches.map((b) => (
                                <option key={b._id} value={b.name}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Roll */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">রোল *</label>
                        <input name="roll" defaultValue={item.roll} required className="input input-bordered w-full" />
                    </div>

                    {/* Division */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">ডিভিশন (ঐচ্ছিক)</label>
                        <select name="division" defaultValue={item.division || ""} className="select select-bordered w-full">
                            <option value="">-- None --</option>
                            {DIVISIONS.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* School Name (full) */}
                    <div className="form-control md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">স্কুলের নাম</label>
                        <input name="schoolName" defaultValue={item.schoolName || ""} className="input input-bordered w-full" />
                    </div>

                    {/* School Roll */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">স্কুল রোল</label>
                        <input name="schoolRoll" defaultValue={item.schoolRoll || ""} className="input input-bordered w-full" />
                    </div>

                    {/* School Section */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">স্কুল সেকশন</label>
                        <select name="schoolSection" defaultValue={item.schoolSection || ""} className="select select-bordered w-full">
                            <option value="">-- None --</option>
                            {SECTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Address (full) */}
                    <div className="form-control md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">ঠিকানা</label>
                        <textarea name="address" defaultValue={item.address || ""} className="textarea textarea-bordered w-full"></textarea>
                    </div>

                    {/* Photo (optional) */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">ছাত্রের ছবি (ঐচ্ছিক)</label>
                        <input type="file" accept="image/*" className="file-input file-input-bordered w-full" onChange={onPhotoChange} />
                        {photoUrl && (
                            <div className="mt-2">
                                <img src={photoUrl} alt="preview" className="mask mask-squircle w-16 h-16 object-cover" />
                            </div>
                        )}
                    </div>

                    {/* Father's name */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">পিতার নাম</label>
                        <input
                            className="input input-bordered w-full"
                            value={fatherName}
                            onChange={(e) => setFatherName(e.target.value)}
                        />
                    </div>

                    {/* Mother's name */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">মাতার নাম</label>
                        <input
                            className="input input-bordered w-full"
                            value={motherName}
                            onChange={(e) => setMotherName(e.target.value)}
                        />
                    </div>

                    {/* Guardian selector */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">অভিভাবক</label>
                        <select
                            className="select select-bordered w-full"
                            value={guardianMode}
                            onChange={(e) => setGuardianMode(e.target.value as any)}
                        >
                            <option value="Father">Father {fatherName ? `(${fatherName})` : ""}</option>
                            <option value="Mother">Mother {motherName ? `(${motherName})` : ""}</option>
                            <option value="Custom">Custom</option>
                        </select>
                    </div>

                    {/* Custom Guardian (only when chosen) */}
                    {guardianMode === "Custom" && (
                        <div className="form-control">
                            <label className="mb-1 block text-sm font-medium">কাস্টম অভিভাবকের নাম</label>
                            <input
                                className="input input-bordered w-full"
                                value={customGuardian}
                                onChange={(e) => setCustomGuardian(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Guardian Phone */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">অভিভাবকের ফোন</label>
                        <input name="guardianPhone" defaultValue={item.guardianPhone || ""} className="input input-bordered w-full" />
                    </div>

                    {/* Gender */}
                    <div className="form-control md:max-w-xs">
                        <label className="mb-1 block text-sm font-medium">লিঙ্গ</label>
                        <select name="gender" defaultValue={item.gender || ""} className="select select-bordered w-full">
                            <option value="">-- Select --</option>
                            <option>Male</option>
                            <option>Female</option>
                        </select>
                    </div>

                    {/* Derived guardian name (read-only, for clarity) */}
                    <div className="form-control md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">অটো-ফিল্ড গার্ডিয়ান নাম</label>
                        <input className="input input-bordered w-full" value={resolvedGuardianName} readOnly />
                    </div>
                </div>

                <div className="card-actions justify-end p-6 pt-0">
                    <a href="/student-list" className="btn btn-ghost">Cancel</a>
                    <button className="btn btn-primary" disabled={loading}>{loading ? "Saving..." : "Update"}</button>
                </div>

                {msg && <div className="px-6 pb-6 -mt-2 text-sm">{msg}</div>}
            </form>
        </div>
    );
}
