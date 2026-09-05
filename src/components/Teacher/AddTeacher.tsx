// src/components/Teacher/AddTeacher.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { IconCopy } from "@tabler/icons-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type Credentials = { username: string; password: string };

export default function AddTeacher() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [imageUrl, setImageUrl] = useState<string>("");
    const [credentials, setCredentials] = useState<Credentials | null>(null);

    function copyCredentials() {
        if (!credentials) return;
        navigator.clipboard
            .writeText(`Username: ${credentials.username}\nPassword: ${credentials.password}`)
            .then(() => toast.success("Copied to clipboard"))
            .catch(() => toast.error("Copy failed"));
    }

    function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) {
            setImageUrl("");
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
            isSuspended: false,
        };
        if (!payload.name || !payload.primarySubject) {
            setError("Name & Primary Subject required");
            setSaving(false);
            return;
        }
        const res = await fetch("/api/teachers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            const created = (await res.json().catch(() => ({}))) as { credentials?: Credentials };
            toast.success("Teacher added");
            router.refresh();
            if (created.credentials) {
                setCredentials(created.credentials);
                setSaving(false);
            } else {
                router.push("/teacher-list");
            }
        } else {
            const j = await res.json().catch(() => ({} as { error?: string }));
            setError(j.error || "Failed to add");
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
                            <Input id="name" name="name" required placeholder="e.g. Mr. Rahman" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">
                                Phone <span className="text-destructive">*</span>
                            </Label>
                            <Input id="phone" name="phone" required placeholder="e.g. 017XXXXXXXX" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="primarySubject">
                                Primary Subject <span className="text-destructive">*</span>
                            </Label>
                            <Input id="primarySubject" name="primarySubject" required placeholder="e.g. Physics" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="joinDate">Join Date</Label>
                            <Input id="joinDate" type="date" name="joinDate" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="salary">Salary</Label>
                            <Input id="salary" name="salary" type="number" placeholder="e.g. 25000" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="photo">Teacher Image (optional)</Label>
                            <Input id="photo" type="file" accept="image/*" onChange={onPhoto} />
                            {imageUrl && (
                                <Image
                                    src={imageUrl}
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
                                {saving ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={!!credentials} onOpenChange={(open) => !open && router.push("/teacher-list")}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Teacher login created</DialogTitle>
                        <DialogDescription>
                            Share these credentials with the teacher. This is the default password — ask them to
                            change it from Change Password after logging in.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Username</Label>
                            <Input readOnly value={credentials?.username ?? ""} className="font-mono" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Password</Label>
                            <Input readOnly value={credentials?.password ?? ""} className="font-mono" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={copyCredentials}>
                            <IconCopy className="size-4" /> Copy
                        </Button>
                        <Button onClick={() => router.push("/teacher-list")}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
