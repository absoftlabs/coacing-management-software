// components/Student/AddStudent.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
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
import { Skeleton } from "@/components/ui/skeleton";

type Batch = { _id: string; name: string };

const DIVISIONS = ["Science", "Humanities", "Commerce"] as const;
type Division = (typeof DIVISIONS)[number];

const SECTIONS = ["A", "B", "C", "D"] as const;
type Section = (typeof SECTIONS)[number];

const GENDERS = ["Male", "Female"] as const;
type Gender = (typeof GENDERS)[number];

type StudentPayload = {
    name: string;
    batch: string;
    roll: string;
    division?: Division;
    schoolName?: string;
    schoolRoll?: string;
    schoolSection?: Section;
    address?: string;
    fatherName?: string;
    motherName?: string;
    guardianName?: string;
    guardianPhone?: string;
    gender?: Gender;
    photoUrl?: string;
    isSuspended: boolean;
    birthDate: string;
    courseFee?: number;
};

export default function AddStudent() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const [batches, setBatches] = useState<Batch[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [batch, setBatch] = useState("");
    const [division, setDivision] = useState("");
    const [schoolSection, setSchoolSection] = useState("");
    const [gender, setGender] = useState("");

    const [guardianMode, setGuardianMode] = useState<"Father" | "Mother" | "Custom">("Father");
    const [fatherName, setFatherName] = useState("");
    const [motherName, setMotherName] = useState("");
    const [customGuardian, setCustomGuardian] = useState("");

    const [photoUrl, setPhotoUrl] = useState<string>("");

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/batches");
                const data: Batch[] = await res.json();
                setBatches(data);
            } catch {
                // ignore
            } finally {
                setLoadingBatches(false);
            }
        })();
    }, []);

    const guardianName = useMemo(() => {
        if (guardianMode === "Father") return fatherName.trim();
        if (guardianMode === "Mother") return motherName.trim();
        return customGuardian.trim();
    }, [guardianMode, fatherName, motherName, customGuardian]);

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
        setSaving(true);
        setError("");

        const payload: StudentPayload = {
            name: String(fd.get("name") || "").trim(),
            batch,
            roll: String(fd.get("roll") || "").trim(),
            division: (division || undefined) as Division | undefined,
            schoolName: String(fd.get("schoolName") || ""),
            schoolRoll: String(fd.get("schoolRoll") || ""),
            schoolSection: (schoolSection || undefined) as Section | undefined,
            address: String(fd.get("address") || ""),
            fatherName: fatherName.trim(),
            motherName: motherName.trim(),
            guardianName,
            guardianPhone: String(fd.get("guardianPhone") || ""),
            gender: (gender || undefined) as Gender | undefined,
            photoUrl,
            isSuspended: false,
            birthDate: String(fd.get("birthDate") || ""),
            courseFee: Number(fd.get("courseFee") || 0) || undefined,
        };

        if (!payload.name || !payload.batch || !payload.roll) {
            setError("Name, Batch, Roll প্রয়োজন");
            setSaving(false);
            return;
        }

        const res = await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            toast.success("Student added");
            router.push("/student-list");
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({} as { error?: string }));
            setError(j.error || "Failed to add");
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Card>
                <CardContent>
                    <form className="grid grid-cols-1 gap-4 md:grid-cols-2" action={(fd) => onSubmit(fd)}>
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Name <span className="text-destructive">*</span>
                            </Label>
                            <Input id="name" name="name" required placeholder="Student name" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="batch">
                                Batch <span className="text-destructive">*</span>
                            </Label>
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
                                    <AlertDescription>No batches found. Create a batch first.</AlertDescription>
                                </Alert>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="roll">
                                Roll <span className="text-destructive">*</span>
                            </Label>
                            <Input id="roll" name="roll" required placeholder="e.g. 101" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="division">Group</Label>
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
                        <div className="space-y-2">
                            <Label htmlFor="birthDate">Birth Date</Label>
                            <Input id="birthDate" name="birthDate" type="date" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="schoolName">School Name</Label>
                            <Input id="schoolName" name="schoolName" placeholder="e.g. City High School" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="schoolRoll">School Roll</Label>
                            <Input id="schoolRoll" name="schoolRoll" placeholder="e.g. 5501" />
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
                            <Textarea id="address" name="address" placeholder="House, Road, Area, City" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="photo">Student Photo</Label>
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
                            <Input
                                id="fatherName"
                                value={fatherName}
                                onChange={(e) => setFatherName(e.target.value)}
                                placeholder="Father's name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="motherName">Mother&apos;s Name</Label>
                            <Input
                                id="motherName"
                                value={motherName}
                                onChange={(e) => setMotherName(e.target.value)}
                                placeholder="Mother's name"
                            />
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
                        <div className="space-y-2">
                            <Label htmlFor="guardianPhone">Guardian Phone</Label>
                            <Input id="guardianPhone" name="guardianPhone" placeholder="01XXXXXXXXX" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="courseFee">Course Fee</Label>
                            <Input id="courseFee" name="courseFee" type="number" placeholder="Course Fee" />
                        </div>

                        {guardianMode === "Custom" && (
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="customGuardian">Custom Guardian Name</Label>
                                <Input
                                    id="customGuardian"
                                    value={customGuardian}
                                    onChange={(e) => setCustomGuardian(e.target.value)}
                                    placeholder="Guardian name"
                                />
                            </div>
                        )}

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="guardianNamePreview">Auto-filled Guardian Name</Label>
                            <Input id="guardianNamePreview" value={guardianName} readOnly />
                            <p className="text-xs text-muted-foreground">
                                Typing the father&apos;s/mother&apos;s name or selecting Custom will automatically show here.
                            </p>
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

                        {error && (
                            <Alert variant="destructive" className="md:col-span-2">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex justify-end gap-2 md:col-span-2">
                            <Link href="/student-list" className={buttonVariants({ variant: "ghost" })}>
                                Cancel
                            </Link>
                            <Button type="submit" disabled={saving}>
                                {saving ? "Saving..." : "Save Student"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
