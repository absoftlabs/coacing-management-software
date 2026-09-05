"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Student = {
    _id: string;
    studentId: string;
    name: string;
    fatherName?: string;
    motherName?: string;
};

export default function AddFee() {
    const router = useRouter();

    const [studentQuery, setStudentQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const [amount, setAmount] = useState<string>("");
    const [depositBy, setDepositBy] = useState<string>("");
    const [receivedBy, setReceivedBy] = useState<string>("");

    const [error, setError] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    const debounceRef = useRef<number | null>(null);

    useEffect(() => {
        if (!studentQuery.trim()) {
            setSearchResults([]);
            return;
        }
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(async () => {
            setLoadingSearch(true);
            try {
                const res = await fetch(`/api/students?q=${encodeURIComponent(studentQuery)}`, { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to search");
                const data: Student[] = await res.json();
                setSearchResults(data.slice(0, 10));
            } catch {
                setSearchResults([]);
            } finally {
                setLoadingSearch(false);
            }
        }, 300);
    }, [studentQuery]);

    const depositOptions = useMemo(() => {
        if (!selectedStudent) return [];
        const opts: string[] = [];
        if (selectedStudent.name) opts.push(`${selectedStudent.name} (Student)`);
        if (selectedStudent.fatherName) opts.push(`${selectedStudent.fatherName} (Father)`);
        if (selectedStudent.motherName) opts.push(`${selectedStudent.motherName} (Mother)`);
        return opts;
    }, [selectedStudent]);

    async function pickStudent(s: Student) {
        try {
            const res = await fetch(`/api/students/${s._id}`, { cache: "no-store" });
            const full: Student | { error?: string } = await res.json();
            if (!res.ok || (full as { error?: string }).error) {
                setSelectedStudent(s);
            } else {
                const doc = full as Student;
                setSelectedStudent({
                    _id: doc._id,
                    studentId: doc.studentId,
                    name: doc.name,
                    fatherName: doc.fatherName,
                    motherName: doc.motherName,
                });
            }
            setStudentQuery(`${s.studentId} — ${s.name}`);
            setSearchResults([]);
            setDepositBy(`${s.name} (Student)`);
        } catch {
            setSelectedStudent(s);
            setStudentQuery(`${s.studentId} — ${s.name}`);
            setSearchResults([]);
            setDepositBy(`${s.name} (Student)`);
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!selectedStudent) {
            setError("Please select a student first.");
            return;
        }
        const amt = Number(amount);
        if (!amt || amt <= 0) {
            setError("Enter a valid amount.");
            return;
        }
        if (!depositBy.trim() || !receivedBy.trim()) {
            setError("All fields are required.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                studentId: selectedStudent.studentId,
                studentName: selectedStudent.name,
                amount: amt,
                depositBy,
                receivedBy,
            };
            const res = await fetch("/api/fees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const j = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(j.error || "Failed to save fee");
            }
            toast.success("Fee collected");
            router.push("/fees-list");
            router.refresh();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <Card>
                <CardContent>
                    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="relative space-y-2 md:col-span-1">
                            <Label htmlFor="studentQuery">Student (Search by ID or Name)</Label>
                            <Input
                                id="studentQuery"
                                placeholder="Type student ID or name…"
                                value={studentQuery}
                                onChange={(e) => {
                                    setStudentQuery(e.target.value);
                                    setSelectedStudent(null);
                                    setDepositBy("");
                                }}
                                autoComplete="off"
                            />
                            {loadingSearch && <div className="absolute top-9 right-3 text-sm text-muted-foreground">⏳</div>}
                            {searchResults.length > 0 && !selectedStudent && (
                                <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-lg">
                                    {searchResults.map((s) => (
                                        <li
                                            key={s._id}
                                            className="cursor-pointer px-3 py-2 hover:bg-muted"
                                            onClick={() => pickStudent(s)}
                                        >
                                            <div className="font-semibold">{s.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                ID: {s.studentId}
                                                {s.fatherName ? ` • Father: ${s.fatherName}` : ""}
                                                {s.motherName ? ` • Mother: ${s.motherName}` : ""}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {selectedStudent && (
                                <p className="text-xs text-muted-foreground">
                                    Selected: <b>{selectedStudent.name}</b> ({selectedStudent.studentId})
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (৳)</Label>
                            <Input
                                id="amount"
                                type="number"
                                min={1}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="depositBy">Deposit By</Label>
                            {selectedStudent ? (
                                <Select value={depositBy} onValueChange={(v) => setDepositBy(v ?? "")}>
                                    <SelectTrigger id="depositBy" className="w-full">
                                        <SelectValue placeholder="-- Select --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {depositOptions.map((n) => (
                                            <SelectItem key={n} value={n}>
                                                {n}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="flex h-9 items-center rounded-md border px-3 text-sm text-muted-foreground">
                                    Select a student first
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="receivedBy">Received By</Label>
                            <Input
                                id="receivedBy"
                                placeholder="e.g. Accounts / Admin"
                                value={receivedBy}
                                onChange={(e) => setReceivedBy(e.target.value)}
                                required
                            />
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
                            <Button type="submit" disabled={submitting}>
                                {submitting ? "Saving..." : "Save Fee"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
