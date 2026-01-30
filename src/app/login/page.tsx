"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                router.replace("/");
            }
        })();
    }, [router]);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password }),
            });
            if (!res.ok) {
                const j = (await res.json().catch(() => ({}))) as { error?: string };
                setError(j.error ?? "Login failed");
                return;
            }
            if (typeof window !== "undefined") {
                window.location.href = "/";
            } else {
                router.replace("/");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-dvh bg-base-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-base-200 via-base-300 to-base-100 opacity-80" />
            <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />

            <div className="relative min-h-dvh flex items-center justify-center p-4">
                <div className="card w-full max-w-md bg-base-100/90 shadow-2xl backdrop-blur">
                    <div className="card-body gap-5">
                        <div className="space-y-2 text-center">
                            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center text-xl font-bold">
                                CMS
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight">Admin Sign In</h1>
                            <p className="text-sm opacity-70">
                                Welcome back. Please enter your credentials.
                            </p>
                        </div>

                        <form className="space-y-4" onSubmit={onSubmit}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email or Username</label>
                                <input
                                    className="input input-bordered w-full rounded-full px-5"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="admin@absoftlab.com"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <input
                                    className="input input-bordered w-full rounded-full px-5"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="alert alert-error text-sm">
                                    <span>{error}</span>
                                </div>
                            )}

                            <button className="btn btn-primary w-full rounded-full" disabled={loading}>
                                {loading ? "Signing in..." : "Sign in"}
                            </button>
                        </form>

                        <div className="text-center text-xs opacity-60">
                            Coaching Management Software
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
