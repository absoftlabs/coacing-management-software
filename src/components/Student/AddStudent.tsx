// components/Student/AddStudent.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Batch = { _id: string; name: string };

const DIVISIONS = ["Science", "Humanities", "Commerce"] as const;
type Division = (typeof DIVISIONS)[number];

const SECTIONS = ["A", "B", "C", "D"] as const;
type Section = (typeof SECTIONS)[number];

const GENDERS = ["Male", "Female"] as const;
type Gender = (typeof GENDERS)[number];

type StudentPayload = {
    name: string;
    batch: string;
    roll: string;
    division?: Division;
    schoolName?: string;
    schoolRoll?: string;
    schoolSection?: Section;
    address?: string;
    fatherName?: string;
    motherName?: string;
    guardianName?: string;
    guardianPhone?: string;
    gender?: Gender;
    photoUrl?: string;
    isSuspended: boolean;
};

export default function AddStudent() {
    const router = useRouter();
    const [msg, setMsg] = useState("");
    const [saving, setSaving] = useState(false);

    const [batches, setBatches] = useState<Batch[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(true);

    const [guardianMode, setGuardianMode] = useState<"Father" | "Mother" | "Custom">("Father");
    const [fatherName, setFatherName] = useState("");
    const [motherName, setMotherName] = useState("");
    const [customGuardian, setCustomGuardian] = useState("");

    const [photoUrl, setPhotoUrl] = useState<string>("");

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/batches");
                const data: Batch[] = await res.json();
                setBatches(data);
            } catch {
                // ignore
            } finally {
                setLoadingBatches(false);
            }
        })();
    }, []);

    const guardianName = useMemo(() => {
        if (guardianMode === "Father") return fatherName.trim();
        if (guardianMode === "Mother") return motherName.trim();
        return customGuardian.trim();
    }, [guardianMode, fatherName, motherName, customGuardian]);

    function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) {
            setPhotoUrl("");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setPhotoUrl(String(reader.result || ""));
        reader.readAsDataURL(file);
    }

    async function onSubmit(fd: FormData) {
        setSaving(true);
        setMsg("");

        // Safely parse to typed fields (no any)
        const divisionRaw = String(fd.get("division") || "");
        const division: Division | undefined = divisionRaw ? (divisionRaw as Division) : undefined;

        const sectionRaw = String(fd.get("schoolSection") || "");
        const schoolSection: Section | undefined = sectionRaw ? (sectionRaw as Section) : undefined;

        const genderRaw = String(fd.get("gender") || "");
        const gender: Gender | undefined = genderRaw ? (genderRaw as Gender) : undefined;

        const payload: StudentPayload = {
            name: String(fd.get("name") || "").trim(),
            batch: String(fd.get("batch") || "").trim(),
            roll: String(fd.get("roll") || "").trim(),
            division,
            schoolName: String(fd.get("schoolName") || ""),
            schoolRoll: String(fd.get("schoolRoll") || ""),
            schoolSection,
            address: String(fd.get("address") || ""),
            fatherName: fatherName.trim(),
            motherName: motherName.trim(),
            guardianName: guardianName,
            guardianPhone: String(fd.get("guardianPhone") || ""),
            gender,
            photoUrl,
            isSuspended: false,
        };

        if (!payload.name || !payload.batch || !payload.roll) {
            setMsg("❌ Name, Batch, Roll প্রয়োজন");
            setSaving(false);
            return;
        }

        const res = await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            router.push("/student-list");
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({} as { error?: string }));
            setMsg("❌ " + (j.error || "Failed to add"));
            setSaving(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Add Student</h1>

            <form className="card bg-base-100 shadow-xl" action={async (fd) => onSubmit(fd)}>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">
                            নাম <span className="text-error">*</span>
                        </label>
                        <input name="name" required className="input input-bordered w-full" placeholder="Student name" />
                    </div>

                    {/* Batch */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">
                            ব্যাচ <span className="text-error">*</span>
                        </label>
                        {loadingBatches ? (
                            <div className="skeleton h-10 w-full" />
                        ) : batches.length ? (
                            <select name="batch" required className="select select-bordered w-full">
                                <option value="">-- Select Batch --</option>
                                {batches.map((b) => (
                                    <option key={b._id} value={b.name}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="alert alert-warning text-sm">No batches found. Create a batch first.</div>
                        )}
                    </div>

                    {/* Roll */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">
                            রোল <span className="text-error">*</span>
                        </label>
                        <input name="roll" required className="input input-bordered w-full" placeholder="e.g. 101" />
                    </div>

                    {/* Division */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">ডিভিশন (ঐচ্ছিক)</label>
                        <select name="division" className="select select-bordered w-full" defaultValue="">
                            <option value="">-- None --</option>
                            {DIVISIONS.map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* School Name (full) */}
                    <div className="form-control md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">স্কুলের নাম</label>
                        <input name="schoolName" className="input input-bordered w-full" placeholder="e.g. City High School" />
                    </div>

                    {/* School Roll */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">স্কুল রোল</label>
                        <input name="schoolRoll" className="input input-bordered w-full" placeholder="e.g. 5501" />
                    </div>

                    {/* School Section */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">স্কুল সেকশন</label>
                        <select name="schoolSection" className="select select-bordered w-full" defaultValue="">
                            <option value="">-- None --</option>
                            {SECTIONS.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Address (full) */}
                    <div className="form-control md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">ঠিকানা</label>
                        <textarea name="address" className="textarea textarea-bordered w-full" placeholder="House, Road, Area, City" />
                    </div>

                    {/* Photo (optional) */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">ছাত্রের ছবি (ঐচ্ছিক)</label>
                        <input type="file" accept="image/*" className="file-input file-input-bordered w-full" onChange={onPhotoChange} />
                        {photoUrl && (
                            <div className="mt-2">
                                <Image
                                    src={photoUrl}
                                    alt="preview"
                                    width={64}
                                    height={64}
                                    className="mask mask-squircle w-16 h-16 object-cover"
                                />
                            </div>
                        )}
                    </div>

                    {/* Father's name */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">পিতার নাম</label>
                        <input
                            className="input input-bordered w-full"
                            value={fatherName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFatherName(e.target.value)}
                            placeholder="Father's name"
                        />
                    </div>

                    {/* Mother's name */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">মাতার নাম</label>
                        <input
                            className="input input-bordered w-full"
                            value={motherName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMotherName(e.target.value)}
                            placeholder="Mother's name"
                        />
                    </div>

                    {/* Guardian selector */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">অভিভাবক</label>
                        <select
                            className="select select-bordered w-full"
                            value={guardianMode}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                setGuardianMode(e.target.value as "Father" | "Mother" | "Custom")
                            }
                        >
                            <option value="Father">Father {fatherName ? `(${fatherName})` : ""}</option>
                            <option value="Mother">Mother {motherName ? `(${motherName})` : ""}</option>
                            <option value="Custom">Custom</option>
                        </select>
                    </div>

                    {/* Guardian Phone */}
                    <div className="form-control">
                        <label className="mb-1 block text-sm font-medium">অভিভাবকের ফোন</label>
                        <input name="guardianPhone" className="input input-bordered w-full" placeholder="01XXXXXXXXX" />
                    </div>

                    {/* Custom Guardian (only when chosen) */}
                    {guardianMode === "Custom" && (
                        <div className="form-control md:col-span-2">
                            <label className="mb-1 block text-sm font-medium">কাস্টম অভিভাবকের নাম</label>
                            <input
                                className="input input-bordered w-full"
                                value={customGuardian}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomGuardian(e.target.value)}
                                placeholder="Guardian name"
                            />
                        </div>
                    )}

                    {/* Derived guardian name (read-only) */}
                    <div className="form-control md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">অটো-ফিল্ড গার্ডিয়ান নাম</label>
                        <input className="input input-bordered w-full" value={guardianName} readOnly />
                        <span className="text-xs opacity-60 mt-1">
                            পিতা/মাতার নাম টাইপ করলে বা Custom দিলে এখানে স্বয়ংক্রিয়ভাবে দেখাবে।
                        </span>
                    </div>

                    {/* Gender */}
                    <div className="form-control md:max-w-xs">
                        <label className="mb-1 block text-sm font-medium">লিঙ্গ</label>
                        <select name="gender" className="select select-bordered w-full" defaultValue="">
                            <option value="">-- Select --</option>
                            {GENDERS.map((g) => (
                                <option key={g} value={g}>
                                    {g}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* actions */}
                    <div className="md:col-span-2 flex justify-end gap-2">
                        <a href="/student-list" className="btn btn-ghost">
                            Cancel
                        </a>
                        <button className="btn btn-primary" disabled={saving}>
                            {saving ? "Saving..." : "Save Student"}
                        </button>
                    </div>

                    {msg && <div className="md:col-span-2 text-sm">{msg}</div>}
                </div>
            </form>
        </div>
    );
}
