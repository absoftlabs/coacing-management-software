"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"] as const;

type Batch = { _id: string; name: string };
type Teacher = { _id: string; name: string; isSuspended?: boolean };

export default function AddClass() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [batches, setBatches] = useState<Batch[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [batch, setBatch] = useState("");

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(true);
    const [teacherId, setTeacherId] = useState("");

    const [days, setDays] = useState<Set<string>>(new Set());
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/batches", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load batches");
                setBatches(await res.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingBatches(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/teachers?suspended=false", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load teachers");
                const data: Teacher[] = await res.json();
                setTeachers(data.filter((t) => !t.isSuspended));
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingTeachers(false);
            }
        })();
    }, []);

    function toggleDay(day: string, checked: boolean) {
        setDays((prev) => {
            const next = new Set(prev);
            if (checked) next.add(day);
            else next.delete(day);
            return next;
        });
    }

    async function onSubmit(fd: FormData) {
        setLoading(true);
        setError("");

        const teacherName = teachers.find((t) => t._id === teacherId)?.name ?? "";

        const payload = {
            name: String(fd.get("name") || "").trim(),
            code: String(fd.get("code") || "").trim(),
            teacher: teacherName,
            batch,
            days: DAYS.filter((d) => days.has(d)),
            isActive,
        };

        if (!payload.name || !payload.code || !teacherId || !batch) {
            setError("Name, Code, Teacher, Batch প্রয়োজন");
            setLoading(false);
            return;
        }

        const res = await fetch("/api/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            toast.success("Class created");
            router.push("/class-list");
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({} as { error?: string }));
            setError(j.error || "Failed to create");
        }
        setLoading(false);
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <Card>
                <CardContent>
                    <form className="grid grid-cols-1 gap-4 md:grid-cols-2" action={(fd) => onSubmit(fd)}>
                        <div className="space-y-2">
                            <Label htmlFor="name">Class Name *</Label>
                            <Input id="name" name="name" required placeholder="e.g. Physics HSC 2026" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">Class Code *</Label>
                            <Input id="code" name="code" required placeholder="e.g. PHY-26-A" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="teacher">Teacher *</Label>
                            {loadingTeachers ? (
                                <Skeleton className="h-9 w-full" />
                            ) : teachers.length ? (
                                <Select value={teacherId} onValueChange={(v) => setTeacherId(v ?? "")}>
                                    <SelectTrigger id="teacher" className="w-full">
                                        <SelectValue placeholder="-- Select Teacher --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teachers.map((t) => (
                                            <SelectItem key={t._id} value={t._id}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Alert variant="destructive">
                                    <AlertDescription>No active teachers found. Please add a teacher first.</AlertDescription>
                                </Alert>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="batch">Batch *</Label>
                            {loadingBatches ? (
                                <Skeleton className="h-9 w-full" />
                            ) : batches.length ? (
                                <Select value={batch} onValueChange={(v) => setBatch(v ?? "")}>
                                    <SelectTrigger id="batch" className="w-full">
                                        <SelectValue placeholder="-- Select Batch --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {batches.map((b) => (
                                            <SelectItem key={b._id} value={b.name}>
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Alert variant="destructive">
                                    <AlertDescription>No batches found. Please create a batch first.</AlertDescription>
                                </Alert>
                            )}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Days</Label>
                            <div className="flex flex-wrap gap-3">
                                {DAYS.map((d) => (
                                    <label key={d} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                                        <Checkbox checked={days.has(d)} onCheckedChange={(c) => toggleDay(d, c === true)} />
                                        {d}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-md border px-3 py-2 md:col-span-2">
                            <Label htmlFor="isActive">Active</Label>
                            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                        </div>

                        {error && (
                            <Alert variant="destructive" className="md:col-span-2">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex justify-end gap-2 md:col-span-2">
                            <Link href="/class-list" className={buttonVariants({ variant: "ghost" })}>
                                Cancel
                            </Link>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : "Save Class"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
