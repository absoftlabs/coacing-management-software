"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { ResultType } from "@/lib/types";
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

type Batch = { _id: string; name: string };
type Student = { _id: string; studentId: string; name: string; batch: string };
type ClassItem = { _id: string; name: string; batch?: string };

type SubjectRow = {
    className: string;
    mcqTotal: number;
    mcqGain: number;
    quesTotal: number;
    quesGain: number;
};

const RESULT_TYPES: ResultType[] = ["Class Test", "Weekly Test", "Quiz Test", "Model Test", "Custom"];

export default function AddResult() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const [batches, setBatches] = useState<Batch[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [allClasses, setAllClasses] = useState<ClassItem[]>([]);

    const [selectedBatch, setSelectedBatch] = useState<string>("");
    const [selectedStudent, setSelectedStudent] = useState<string>("");
    const [resultType, setResultType] = useState<ResultType | "">("");
    const [examDate, setExamDate] = useState<string>("");

    const [subjects, setSubjects] = useState<SubjectRow[]>([
        { className: "", mcqTotal: 0, mcqGain: 0, quesTotal: 0, quesGain: 0 },
    ]);

    useEffect(() => {
        (async () => {
            try {
                const [bRes, cRes] = await Promise.all([fetch("/api/batches"), fetch("/api/classes")]);
                if (bRes.ok) setBatches(await bRes.json());
                if (cRes.ok) setAllClasses(await cRes.json());
            } catch {
                // ignore
            }
        })();
    }, []);

    useEffect(() => {
        if (!selectedBatch) {
            setStudents([]);
            return;
        }
        (async () => {
            try {
                const res = await fetch(`/api/students?batch=${encodeURIComponent(selectedBatch)}`);
                if (res.ok) setStudents(await res.json());
            } catch {
                setStudents([]);
            }
        })();
    }, [selectedBatch]);

    useEffect(() => {
        if (!selectedBatch) return;
        (async () => {
            try {
                const res = await fetch(`/api/classes?batch=${encodeURIComponent(selectedBatch)}`);
                if (res.ok) {
                    const cls: ClassItem[] = await res.json();
                    if (cls.length) setAllClasses(cls);
                }
            } catch {
                // ignore
            }
        })();
    }, [selectedBatch]);

    const filteredClasses = useMemo(() => {
        if (!selectedBatch) return [];
        const list = allClasses.filter((c) => !c.batch || c.batch === selectedBatch);
        return list.length ? list : allClasses;
    }, [allClasses, selectedBatch]);

    useEffect(() => {
        if (!selectedBatch) return;
        if (filteredClasses.length === 1) {
            const onlyClass = filteredClasses[0];
            setSubjects([{ className: onlyClass?.name ?? "", mcqTotal: 0, mcqGain: 0, quesTotal: 0, quesGain: 0 }]);
        } else if (filteredClasses.length > 1) {
            setSubjects((prev) =>
                prev.map((s) => ({
                    ...s,
                    className: filteredClasses.some((c) => c.name === s.className) ? s.className : "",
                }))
            );
        } else {
            setSubjects([{ className: "", mcqTotal: 0, mcqGain: 0, quesTotal: 0, quesGain: 0 }]);
        }
    }, [selectedBatch, filteredClasses]);

    const canAddMoreSubjects = !!selectedBatch;

    function addSubject() {
        setSubjects((prev) => [...prev, { className: "", mcqTotal: 0, mcqGain: 0, quesTotal: 0, quesGain: 0 }]);
    }
    function removeSubject(index: number) {
        setSubjects((prev) => prev.filter((_, i) => i !== index));
    }
    function updateSubject<K extends keyof SubjectRow>(i: number, field: K, value: SubjectRow[K]) {
        setSubjects((prev) => {
            const copy = [...prev];
            copy[i] = { ...copy[i], [field]: value };
            return copy;
        });
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setSaving(true);

        if (!selectedBatch) {
            setError("Select batch");
            setSaving(false);
            return;
        }
        if (!selectedStudent) {
            setError("Select student");
            setSaving(false);
            return;
        }
        if (!resultType) {
            setError("Select result type");
            setSaving(false);
            return;
        }

        const student = students.find((s) => s._id === selectedStudent);
        if (!student) {
            setError("Invalid student");
            setSaving(false);
            return;
        }

        const invalid = subjects.find(
            (s) =>
                !s.className ||
                !Number.isFinite(Number(s.mcqTotal)) ||
                !Number.isFinite(Number(s.mcqGain)) ||
                !Number.isFinite(Number(s.quesTotal)) ||
                !Number.isFinite(Number(s.quesGain))
        );
        if (invalid) {
            setError("Please fill subject rows correctly");
            setSaving(false);
            return;
        }

        const payload = {
            batch: selectedBatch,
            studentId: student.studentId,
            studentName: student.name,
            resultType: resultType as ResultType,
            examDate: examDate || new Date().toISOString(),
            subjects: subjects.map((s) => ({
                className: s.className,
                mcqTotal: Number(s.mcqTotal) || 0,
                mcqGain: Number(s.mcqGain) || 0,
                quesTotal: Number(s.quesTotal) || 0,
                quesGain: Number(s.quesGain) || 0,
            })),
        };

        const res = await fetch("/api/results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            toast.success("Result saved");
            router.push("/result-list");
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({} as { error?: string }));
            setError(j.error || "Failed to save");
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <Card>
                <CardContent className="space-y-4">
                    <form className="space-y-4" onSubmit={onSubmit}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="space-y-2">
                                <Label>Batch</Label>
                                <Select value={selectedBatch} onValueChange={(v) => setSelectedBatch(v ?? "")}>
                                    <SelectTrigger className="w-full">
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
                            </div>
                            <div className="space-y-2">
                                <Label>Student</Label>
                                <Select
                                    value={selectedStudent}
                                    onValueChange={(v) => setSelectedStudent(v ?? "")}
                                    disabled={!selectedBatch}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="-- Select Student --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map((s) => (
                                            <SelectItem key={s._id} value={s._id}>
                                                {s.name} ({s.studentId})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Result Type</Label>
                                <Select value={resultType} onValueChange={(v) => setResultType((v ?? "") as ResultType | "")}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="-- Select --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RESULT_TYPES.map((rt) => (
                                            <SelectItem key={rt} value={rt}>
                                                {rt}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="examDate">Exam Date</Label>
                                <Input id="examDate" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="border-t pt-4">
                            <div className="space-y-4">
                                {subjects.map((sub, idx) => (
                                    <div key={idx} className="space-y-3 rounded-lg border p-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold">Subject #{idx + 1}</h3>
                                            <div className="flex gap-2">
                                                {filteredClasses.length > 1 && (
                                                    <Button type="button" size="icon-sm" variant="outline" onClick={addSubject} title="Add">
                                                        <IconPlus className="size-4" />
                                                    </Button>
                                                )}
                                                {subjects.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        size="icon-sm"
                                                        variant="destructive"
                                                        onClick={() => removeSubject(idx)}
                                                        title="Remove"
                                                    >
                                                        <IconTrash className="size-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                                            <div className="space-y-2">
                                                <Label>Class / Subject</Label>
                                                <Select
                                                    value={sub.className}
                                                    onValueChange={(v) => updateSubject(idx, "className", v ?? "")}
                                                    disabled={!selectedBatch || filteredClasses.length === 0}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={selectedBatch ? "-- Select --" : "Select batch first"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filteredClasses.map((c) => (
                                                            <SelectItem key={c._id ?? c.name} value={c.name}>
                                                                {c.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>MCQ Total</Label>
                                                <Input
                                                    type="number"
                                                    value={sub.mcqTotal}
                                                    onChange={(e) => updateSubject(idx, "mcqTotal", Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>MCQ Gain</Label>
                                                <Input
                                                    type="number"
                                                    value={sub.mcqGain}
                                                    onChange={(e) => updateSubject(idx, "mcqGain", Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Question Total</Label>
                                                <Input
                                                    type="number"
                                                    value={sub.quesTotal}
                                                    onChange={(e) => updateSubject(idx, "quesTotal", Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Question Gain</Label>
                                                <Input
                                                    type="number"
                                                    value={sub.quesGain}
                                                    onChange={(e) => updateSubject(idx, "quesGain", Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button type="button" variant="outline" onClick={addSubject} disabled={!canAddMoreSubjects}>
                                    Add Another Subject
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex justify-end gap-2">
                            <Link href="/result-list" className={buttonVariants({ variant: "ghost" })}>
                                Cancel
                            </Link>
                            <Button type="submit" disabled={saving}>
                                {saving ? "Saving..." : "Save Result"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
