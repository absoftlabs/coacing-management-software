// components/Student/EditStudent.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import type { StudentDoc } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const DIVISIONS = ["Science", "Humanities", "Commerce"] as const;
const SECTIONS = ["A", "B", "C", "D"] as const;
const GENDERS = ["Male", "Female"] as const;

export type StudentItem = StudentDoc & { _id: string };

export default function EditStudent({ item }: { item: StudentItem }) {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [batch, setBatch] = useState(item.batch);
    const [division, setDivision] = useState(item.division || "");
    const [schoolSection, setSchoolSection] = useState(item.schoolSection || "");
    const [gender, setGender] = useState(item.gender || "");

    const [guardianMode, setGuardianMode] = useState<"Father" | "Mother" | "Custom">(() => {
        if (item.guardianName && item.guardianName === item.fatherName) return "Father";
        if (item.guardianName && item.guardianName === item.motherName) return "Mother";
        return "Custom";
    });
    const [fatherName, setFatherName] = useState(item.fatherName || "");
    const [motherName, setMotherName] = useState(item.motherName || "");
    const [customGuardian, setCustomGuardian] = useState(
        (guardianMode === "Custom" ? item.guardianName : "") || ""
    );

    const [photoUrl, setPhotoUrl] = useState<string>(item.photoUrl || "");

    const resolvedGuardianName = useMemo(() => {
        if (guardianMode === "Father") return fatherName.trim();
        if (guardianMode === "Mother") return motherName.trim();
        return customGuardian.trim();
    }, [guardianMode, fatherName, motherName, customGuardian]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/batches");
                const data: Batch[] = await res.json();
                setBatches(data);
            } catch {
                // ignore
            }
        })();
    }, []);

    function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) {
            setPhotoUrl("");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setPhotoUrl(String(reader.result || ""));
        reader.readAsDataURL(file);
    }

    async function onSubmit(fd: FormData) {
        setLoading(true);
        setError("");

        const payload: Partial<StudentDoc> = {
            name: String(fd.get("name") || "").trim(),
            batch,
            roll: String(fd.get("roll") || "").trim(),
            division: (division || undefined) as StudentDoc["division"],
            schoolName: String(fd.get("schoolName") || ""),
            schoolRoll: String(fd.get("schoolRoll") || ""),
            schoolSection: (schoolSection || undefined) as StudentDoc["schoolSection"],
            address: String(fd.get("address") || ""),
            fatherName: fatherName.trim(),
            motherName: motherName.trim(),
            guardianName: resolvedGuardianName,
            guardianPhone: String(fd.get("guardianPhone") || ""),
            gender: (gender || undefined) as StudentDoc["gender"],
            photoUrl,
            birthDate: String(fd.get("birthDate") || ""),
            courseFee: Number(fd.get("courseFee") || 0) || undefined,
        };

        const res = await fetch(`/api/students/${item._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            toast.success("Student updated");
            router.push("/student-list");
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({} as { error?: string }));
            setError(j.error || "Failed to update");
        }
        setLoading(false);
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="text-sm text-muted-foreground">
                Student ID: <span className="font-mono">{item.studentId}</span>
            </div>
            <Card>
                <CardContent>
                    <form className="grid grid-cols-1 gap-4 md:grid-cols-2" action={(fd) => onSubmit(fd)}>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" name="name" defaultValue={item.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="batch">Batch *</Label>
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
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="roll">Roll *</Label>
                            <Input id="roll" name="roll" defaultValue={item.roll} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="division">Group (optional)</Label>
                            <Select value={division} onValueChange={(v) => setDivision(v ?? "")}>
                                <SelectTrigger id="division" className="w-full">
                                    <SelectValue placeholder="-- None --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DIVISIONS.map((d) => (
                                        <SelectItem key={d} value={d}>
                                            {d}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="schoolName">School Name</Label>
                            <Input id="schoolName" name="schoolName" defaultValue={item.schoolName || ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="schoolRoll">School Roll</Label>
                            <Input id="schoolRoll" name="schoolRoll" defaultValue={item.schoolRoll || ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="schoolSection">School Section</Label>
                            <Select value={schoolSection} onValueChange={(v) => setSchoolSection(v ?? "")}>
                                <SelectTrigger id="schoolSection" className="w-full">
                                    <SelectValue placeholder="-- None --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SECTIONS.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" name="address" defaultValue={item.address || ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="birthDate">Birth Date</Label>
                            <Input id="birthDate" name="birthDate" type="date" defaultValue={item.birthDate || ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="photo">Student Photo (optional)</Label>
                            <Input id="photo" type="file" accept="image/*" onChange={onPhotoChange} />
                            {photoUrl && (
                                <Image
                                    src={photoUrl}
                                    alt="preview"
                                    width={64}
                                    height={64}
                                    className="mt-2 size-16 rounded-md object-cover"
                                />
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fatherName">Father&apos;s Name</Label>
                            <Input id="fatherName" value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="motherName">Mother&apos;s Name</Label>
                            <Input id="motherName" value={motherName} onChange={(e) => setMotherName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="guardianMode">Guardian</Label>
                            <Select value={guardianMode} onValueChange={(v) => setGuardianMode(v as typeof guardianMode)}>
                                <SelectTrigger id="guardianMode" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Father">Father {fatherName ? `(${fatherName})` : ""}</SelectItem>
                                    <SelectItem value="Mother">Mother {motherName ? `(${motherName})` : ""}</SelectItem>
                                    <SelectItem value="Custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {guardianMode === "Custom" && (
                            <div className="space-y-2">
                                <Label htmlFor="customGuardian">Custom Guardian Name</Label>
                                <Input
                                    id="customGuardian"
                                    value={customGuardian}
                                    onChange={(e) => setCustomGuardian(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="guardianPhone">Guardian Phone</Label>
                            <Input id="guardianPhone" name="guardianPhone" defaultValue={item.guardianPhone || ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="courseFee">Course Fee</Label>
                            <Input id="courseFee" name="courseFee" type="number" defaultValue={item.courseFee ?? ""} />
                        </div>
                        <div className="space-y-2 md:max-w-xs">
                            <Label htmlFor="gender">Gender</Label>
                            <Select value={gender} onValueChange={(v) => setGender(v ?? "")}>
                                <SelectTrigger id="gender" className="w-full">
                                    <SelectValue placeholder="-- Select --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GENDERS.map((g) => (
                                        <SelectItem key={g} value={g}>
                                            {g}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="guardianNamePreview">Auto-filled Guardian Name</Label>
                            <Input id="guardianNamePreview" value={resolvedGuardianName} readOnly />
                        </div>

                        {error && (
                            <Alert variant="destructive" className="md:col-span-2">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex justify-end gap-2 md:col-span-2">
                            <Link href="/student-list" className={buttonVariants({ variant: "ghost" })}>
                                Cancel
                            </Link>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : "Update"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
