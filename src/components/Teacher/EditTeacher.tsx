// src/components/Teacher/EditTeacher.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import type { TeacherDoc } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditTeacher({ item }: { item: TeacherDoc }) {
    const router = useRouter();
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>(item.imageUrl || "");

    function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) {
            setImageUrl(item.imageUrl || "");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setImageUrl(String(reader.result || ""));
        reader.readAsDataURL(f);
    }

    async function onSubmit(fd: FormData) {
        setSaving(true);
        setError("");
        const payload = {
            name: String(fd.get("name") || "").trim(),
            phone: String(fd.get("phone") || "").trim(),
            imageUrl,
            primarySubject: String(fd.get("primarySubject") || "").trim(),
            joinDate: String(fd.get("joinDate") || "") || undefined,
            salary: Number(fd.get("salary") || "") || undefined,
        };
        if (!payload.name || !payload.primarySubject) {
            setError("Name & Primary Subject required");
            setSaving(false);
            return;
        }
        const res = await fetch(`/api/teachers/${item._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            toast.success("Teacher updated");
            router.push("/teacher-list");
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({} as { error?: string }));
            setError(j.error || "Failed to update");
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <Card>
                <CardContent>
                    <form className="grid grid-cols-1 gap-4 md:grid-cols-2" action={(fd) => onSubmit(fd)}>
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Teacher Name <span className="text-destructive">*</span>
                            </Label>
                            <Input id="name" name="name" defaultValue={item.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">
                                Phone <span className="text-destructive">*</span>
                            </Label>
                            <Input id="phone" name="phone" defaultValue={item.phone} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="primarySubject">
                                Primary Subject <span className="text-destructive">*</span>
                            </Label>
                            <Input id="primarySubject" name="primarySubject" defaultValue={item.primarySubject} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="joinDate">Join Date</Label>
                            <Input id="joinDate" type="date" name="joinDate" defaultValue={item.joinDate || ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="salary">Salary</Label>
                            <Input id="salary" name="salary" type="number" defaultValue={item.salary ?? ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="photo">Teacher Image</Label>
                            <Input id="photo" type="file" accept="image/*" onChange={onPhoto} />
                            {(imageUrl || item.imageUrl) && (
                                <Image
                                    src={imageUrl || item.imageUrl || ""}
                                    alt="preview"
                                    width={64}
                                    height={64}
                                    className="mt-2 size-16 rounded-md object-cover"
                                />
                            )}
                        </div>

                        {error && (
                            <Alert variant="destructive" className="md:col-span-2">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex justify-end gap-2 md:col-span-2">
                            <Link href="/teacher-list" className={buttonVariants({ variant: "ghost" })}>
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
