"use client";

import { useState } from "react";

export default function ChangePasswordPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage("");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            if (!res.ok) {
                const j = (await res.json().catch(() => ({}))) as { error?: string };
                setMessage(j.error ?? "Failed to change password");
                return;
            }
            setMessage("✅ Password updated");
            setCurrentPassword("");
            setNewPassword("");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md">
            <h1 className="text-2xl font-semibold mb-4">Change Password</h1>
            <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Current Password</label>
                    <input
                        className="input input-bordered w-full rounded-full px-5"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <input
                        className="input input-bordered w-full rounded-full px-5"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                    <div className="text-xs opacity-60">Minimum 8 characters</div>
                </div>
                {message && (
                    <div className={message.startsWith("✅") ? "text-success" : "text-error"}>
                        {message}
                    </div>
                )}
                <button className="btn btn-primary" disabled={loading}>
                    {loading ? "Updating..." : "Update Password"}
                </button>
            </form>
        </div>
    );
}
