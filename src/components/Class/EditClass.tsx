"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    const [error, setError] = useState("");
    const [days, setDays] = useState<Set<string>>(new Set(item.days || []));
    const [isActive, setIsActive] = useState(item.isActive ?? true);
    const [saving, setSaving] = useState(false);

    function toggleDay(day: string, checked: boolean) {
        setDays((prev) => {
            const next = new Set(prev);
            if (checked) next.add(day);
            else next.delete(day);
            return next;
        });
    }

    async function onSubmit(fd: FormData) {
        setSaving(true);
        setError("");
        const payload = {
            name: String(fd.get("name") || "").trim(),
            code: String(fd.get("code") || "").trim(),
            teacher: String(fd.get("teacher") || "").trim(),
            batch: String(fd.get("batch") || "").trim(),
            days: DAYS.filter((d) => days.has(d)),
            isActive,
        };

        const res = await fetch(`/api/classes/${item._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            toast.success("Class updated");
            router.push("/class-list");
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({} as { error?: string }));
            setError(j.error || "Failed to update");
        }
        setSaving(false);
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <Card>
                <CardContent>
                    <form className="grid grid-cols-1 gap-4 md:grid-cols-2" action={(fd) => onSubmit(fd)}>
                        <div className="space-y-2">
                            <Label htmlFor="name">Class Name *</Label>
                            <Input id="name" name="name" defaultValue={item.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">Class Code *</Label>
                            <Input id="code" name="code" defaultValue={item.code} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="teacher">Teacher</Label>
                            <Input id="teacher" name="teacher" defaultValue={item.teacher || ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="batch">Batch Name</Label>
                            <Input id="batch" name="batch" defaultValue={item.batch || ""} />
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
                            <Button type="submit" disabled={saving}>
                                {saving ? "Saving..." : "Update"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
