"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

type Batch = {
    _id: string;
    name: string;
};

export default function AddClass() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string>("");
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(true);

    // ✅ Fetch batches from API
    useEffect(() => {
        async function loadBatches() {
            try {
                const res = await fetch("/api/batches");
                if (!res.ok) throw new Error("Failed to load batches");
                const data = await res.json();
                setBatches(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingBatches(false);
            }
        }
        loadBatches();
    }, []);

    async function onSubmit(formData: FormData) {
        setLoading(true);
        setMsg("");
        const payload = {
            name: String(formData.get("name") || "").trim(),
            code: String(formData.get("code") || "").trim(),
            teacher: String(formData.get("teacher") || "").trim(),
            batch: String(formData.get("batch") || "").trim(), // from dropdown
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
            const j = await res.json().catch(() => ({}));
            setMsg("❌ " + (j.error || "Failed to create"));
        }
        setLoading(false);
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Add Class/Subject</h1>

            <form className="card bg-base-100 shadow-xl" action={async (fd) => onSubmit(fd)}>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Teacher Name</span>
                        </label>
                        <input
                            name="teacher"
                            className="input input-bordered"
                            placeholder="e.g. Mr. Rahman"
                        />
                    </div>

                    {/* ✅ Batch Dropdown */}
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
                                    <input
                                        type="checkbox"
                                        name="days"
                                        value={d}
                                        className="checkbox checkbox-sm"
                                    />
                                    <span className="label-text">{d}</span>
                                </label>
                            ))}
                        </div>
                    </div>

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
