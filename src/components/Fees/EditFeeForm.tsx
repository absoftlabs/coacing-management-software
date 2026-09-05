// src/components/Fees/EditFeeForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type { FeeDoc } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditFeeForm({ initial }: { initial: FeeDoc }) {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(fd: FormData) {
        setLoading(true);
        setError("");

        const payload = {
            studentId: String(fd.get("studentId") || "").trim(),
            studentName: String(fd.get("studentName") || "").trim(),
            depositBy: String(fd.get("depositBy") || "").trim(),
            receivedBy: String(fd.get("receivedBy") || "").trim(),
            amount: Number(fd.get("amount") || 0),
        };

        if (!payload.studentId || !payload.studentName || !payload.depositBy || !payload.receivedBy || !payload.amount) {
            setError("All fields are required");
            setLoading(false);
            return;
        }

        const res = await fetch(`/api/fees/${initial._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            toast.success("Fee updated");
            router.push("/fees-list");
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({} as { error?: string }));
            setError(j.error || "Failed to update");
        }
        setLoading(false);
    }

    return (
        <Card>
            <CardContent>
                <form className="grid grid-cols-1 gap-4 md:grid-cols-2" action={(fd) => onSubmit(fd)}>
                    <div className="space-y-2">
                        <Label htmlFor="studentId">Student ID *</Label>
                        <Input id="studentId" name="studentId" defaultValue={initial.studentId} required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="studentName">Student Name *</Label>
                        <Input id="studentName" name="studentName" defaultValue={initial.studentName} required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="depositBy">Deposit By *</Label>
                        <Input id="depositBy" name="depositBy" defaultValue={initial.depositBy} required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="receivedBy">Received By *</Label>
                        <Input id="receivedBy" name="receivedBy" defaultValue={initial.receivedBy} required />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="amount">Amount *</Label>
                        <Input id="amount" name="amount" type="number" min={0} step="1" defaultValue={initial.amount} required />
                    </div>

                    {error && (
                        <Alert variant="destructive" className="md:col-span-2">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-end gap-2 md:col-span-2">
                        <Link href="/fees-list" className={buttonVariants({ variant: "ghost" })}>
                            Cancel
                        </Link>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Update"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
