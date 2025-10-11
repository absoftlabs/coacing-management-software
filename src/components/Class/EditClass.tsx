"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

type ClassItem = {
    _id: string;
    name: string;
    code: string;
    teacher?: string;
    batch?: string;
    days?: string[];
    isActive?: boolean;
};

export default function EditClass({ item }: { item: ClassItem }) {
    const router = useRouter();
    const [msg, setMsg] = useState("");

    async function onSubmit(fd: FormData) {
        const payload = {
            name: String(fd.get("name") || "").trim(),
            code: String(fd.get("code") || "").trim(),
            teacher: String(fd.get("teacher") || "").trim(),
            batch: String(fd.get("batch") || "").trim(),
            days: DAYS.filter((d) => fd.getAll("days").includes(d)),
            isActive: fd.get("isActive") === "on",
        };

        const res = await fetch(`/api/classes/${item._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            setMsg("✅ Updated");
            router.push("/class-list");
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({}));
            setMsg("❌ " + (j.error || "Failed to update"));
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Edit Class/Subject</h1>

            <form className="card bg-base-100 shadow-xl" action={async (fd) => onSubmit(fd)}>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Class Name *</span></label>
                        <input name="name" defaultValue={item.name} required className="input input-bordered" />
                    </div>

                    <div className="form-control">
                        <label className="label"><span className="label-text">Class Code *</span></label>
                        <input name="code" defaultValue={item.code} required className="input input-bordered" />
                    </div>

                    <div className="form-control">
                        <label className="label"><span className="label-text">Teacher</span></label>
                        <input name="teacher" defaultValue={item.teacher || ""} className="input input-bordered" />
                    </div>

                    <div className="form-control">
                        <label className="label"><span className="label-text">Batch Name</span></label>
                        <input name="batch" defaultValue={item.batch || ""} className="input input-bordered" />
                    </div>

                    <div className="form-control md:col-span-2">
                        <label className="label"><span className="label-text">Days</span></label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS.map((d) => (
                                <label key={d} className="label cursor-pointer gap-2 border rounded-box px-3 py-2">
                                    <input
                                        type="checkbox"
                                        name="days"
                                        value={d}
                                        defaultChecked={(item.days || []).includes(d)}
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
                                defaultChecked={item.isActive ?? true}
                                className="toggle toggle-primary"
                            />
                        </label>
                    </div>
                </div>

                <div className="card-actions justify-end p-6 pt-0">
                    <a href="/class-list" className="btn btn-ghost">Cancel</a>
                    <button className="btn btn-primary">Update</button>
                </div>

                {msg && <div className="px-6 pb-6 -mt-2 text-sm">{msg}</div>}
            </form>
        </div>
    );
}
