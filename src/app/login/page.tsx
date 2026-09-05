"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    IconAlertCircle,
    IconChecklist,
    IconMessage2,
    IconUsers,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useOrgLogo } from "@/hooks/use-org-logo";
import { ORG_NAME } from "@/lib/org";

const FEATURES = [
    { icon: IconUsers, text: "Manage students, teachers & batches" },
    { icon: IconChecklist, text: "Track attendance, fees & results" },
    { icon: IconMessage2, text: "Reach guardians instantly by SMS" },
];

export default function LoginPage() {
    const router = useRouter();
    const logo = useOrgLogo();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/auth/me");
            if (!res.ok) return;
            const data = (await res.json().catch(() => ({}))) as { admin?: { role?: string } };
            router.replace(data.admin?.role === "teacher" ? "/attendance" : "/");
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
            const j = (await res.json().catch(() => ({}))) as { admin?: { role?: string } };
            const dest = j.admin?.role === "teacher" ? "/attendance" : "/";
            if (typeof window !== "undefined") {
                window.location.href = dest;
            } else {
                router.replace(dest);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid min-h-dvh lg:grid-cols-2">
            {/* Branding panel */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-violet-600 p-10 text-primary-foreground lg:flex">
                <div className="pointer-events-none absolute -top-32 -right-20 size-96 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-40 -left-16 size-96 rounded-full bg-black/10 blur-3xl" />

                <div className="relative flex items-center gap-2.5 text-lg font-semibold">
                    <Image
                        src={logo}
                        alt="Logo"
                        width={36}
                        height={36}
                        unoptimized
                        className="size-9 rounded-xl object-cover shadow-sm ring-1 ring-white/20"
                    />
                    Coaching Manager
                </div>

                <div className="relative space-y-6">
                    <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight">
                        Run your coaching center from one place.
                    </h2>
                    <ul className="space-y-3">
                        {FEATURES.map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-center gap-3 text-sm text-primary-foreground/90">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                                    <Icon className="size-4" />
                                </span>
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-xs text-primary-foreground/60">{ORG_NAME}</p>
            </div>

            {/* Form panel */}
            <div className="relative flex items-center justify-center overflow-hidden bg-muted/40 p-6 lg:bg-background lg:p-10">
                <div className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-primary/10 blur-3xl lg:hidden" />
                <div className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-primary/10 blur-3xl lg:hidden" />

                <Card className="relative w-full max-w-sm gap-0 shadow-lg shadow-primary/5 [--card-spacing:--spacing(6)] lg:border-none lg:bg-transparent lg:shadow-none lg:ring-0 lg:[--card-spacing:0]">
                    <CardContent className="space-y-7">
                        <div className="flex flex-col items-center gap-2.5 text-center lg:hidden">
                            <Image
                                src={logo}
                                alt="Logo"
                                width={56}
                                height={56}
                                unoptimized
                                className="size-14 rounded-2xl object-cover shadow-sm ring-1 ring-border"
                            />
                            <p className="text-base font-semibold">Coaching Manager</p>
                        </div>

                        <div className="space-y-1.5 text-center lg:text-left">
                            <h1 className="text-2xl font-semibold tracking-tight">Admin Sign In</h1>
                            <p className="text-sm text-muted-foreground">Welcome back. Please enter your credentials.</p>
                        </div>

                        <form className="space-y-4" onSubmit={onSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="identifier">Email or Username</Label>
                                <Input
                                    id="identifier"
                                    className="h-10 px-3.5"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="admin@absoftlab.com"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    className="h-10 px-3.5"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <IconAlertCircle className="size-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="h-10 w-full" disabled={loading}>
                                {loading ? "Signing in..." : "Sign in"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
