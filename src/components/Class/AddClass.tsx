"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"] as const;

type Batch = {
    _id: string;
    name: string;
};

type Teacher = {
    _id: string;
    name: string;
    isSuspended?: boolean;
};

export default function AddClass() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string>("");

    // batches
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(true);

    // teachers
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(true);

    // fetch batches
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/batches", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load batches");
                const data: Batch[] = await res.json();
                setBatches(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingBatches(false);
            }
        })();
    }, []);

    // fetch teachers (active only)
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/teachers?suspended=false", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load teachers");
                const data: Teacher[] = await res.json();
                // keep only active (not suspended)
                setTeachers(data.filter(t => !t.isSuspended));
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingTeachers(false);
            }
        })();
    }, []);

    async function onSubmit(formData: FormData) {
        setLoading(true);
        setMsg("");

        const payload = {
            name: String(formData.get("name") || "").trim(),
            code: String(formData.get("code") || "").trim(),
            // teacher now comes from a <select>
            teacher: String(formData.get("teacher") || "").trim(),
            batch: String(formData.get("batch") || "").trim(),
            days: DAYS.filter((d) => formData.getAll("days").includes(d)),
            isActive: formData.get("isActive") === "on",
        };

        const res = await fetch("/api/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            setMsg("✅ Class created successfully");
            router.push("/class-list");
            router.refresh();
        } else {
            const j = (await res.json().catch(() => ({} as { error?: string })));
            setMsg("❌ " + (j.error || "Failed to create"));
        }
        setLoading(false);
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Add Class/Subject</h1>

            <form className="card bg-base-100 shadow-xl" action={async (fd) => onSubmit(fd)}>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Class Name */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Class Name *</span>
                        </label>
                        <input
                            name="name"
                            required
                            className="input input-bordered"
                            placeholder="e.g. Physics HSC 2026"
                        />
                    </div>

                    {/* Class Code */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Class Code *</span>
                        </label>
                        <input
                            name="code"
                            required
                            className="input input-bordered"
                            placeholder="e.g. PHY-26-A"
                        />
                    </div>

                    {/* Teacher (dropdown) */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Teacher *</span>
                        </label>
                        {loadingTeachers ? (
                            <div className="skeleton h-10 w-full" />
                        ) : teachers.length ? (
                            <select name="teacher" required className="select select-bordered">
                                <option value="">-- Select Teacher --</option>
                                {teachers.map((t) => (
                                    <option key={t._id} value={t.name}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="alert alert-warning mt-1 text-sm">
                                No active teachers found. Please add a teacher first.
                            </div>
                        )}
                    </div>

                    {/* Batch (dropdown) */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Batch *</span>
                        </label>
                        {loadingBatches ? (
                            <div className="skeleton h-10 w-full"></div>
                        ) : batches.length ? (
                            <select name="batch" required className="select select-bordered">
                                <option value="">-- Select Batch --</option>
                                {batches.map((b) => (
                                    <option key={b._id} value={b.name}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="alert alert-warning mt-1 text-sm">
                                No batches found. Please create a batch first.
                            </div>
                        )}
                    </div>

                    {/* Days */}
                    <div className="form-control md:col-span-2">
                        <label className="label">
                            <span className="label-text">Days</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS.map((d) => (
                                <label
                                    key={d}
                                    className="label cursor-pointer gap-2 border rounded-box px-3 py-2"
                                >
                                    <input type="checkbox" name="days" value={d} className="checkbox checkbox-sm" />
                                    <span className="label-text">{d}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Active */}
                    <div className="form-control md:col-span-2">
                        <label className="label cursor-pointer">
                            <span className="label-text">Active</span>
                            <input
                                type="checkbox"
                                name="isActive"
                                defaultChecked
                                className="toggle toggle-primary"
                            />
                        </label>
                    </div>
                </div>

                <div className="card-actions justify-end p-6 pt-0">
                    <a href="/class-list" className="btn btn-ghost">
                        Cancel
                    </a>
                    <button disabled={loading} className="btn btn-primary">
                        {loading ? "Saving..." : "Save Class"}
                    </button>
                </div>

                {msg && <div className="px-6 pb-6 -mt-2 text-sm">{msg}</div>}
            </form>
        </div>
    );
}
