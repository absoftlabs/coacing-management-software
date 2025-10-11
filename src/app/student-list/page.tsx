// src/app/student-list/page.tsx
import StudentList from "@/components/Student/StudentList";

const DIVISIONS = ["Science", "Humanities", "Commerce"] as const;
type Division = (typeof DIVISIONS)[number];
const SECTIONS = ["A", "B", "C", "D"] as const;
type Section = (typeof SECTIONS)[number];
const GENDERS = ["Male", "Female"] as const;
type Gender = (typeof GENDERS)[number];

export type StudentItem = {
    _id: string;
    studentId: string;
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
    isSuspended?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

type Batch = { _id: string; name: string };

async function getStudents(): Promise<StudentItem[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/students`, {
        // relative URL-ও কাজ করে; BASE_URL দিলাম যাতে লোকাল/প্রোড সেফ থাকে
        cache: "no-store",
    }).catch(() => null);
    if (!res || !res.ok) return [];
    const data = (await res.json()) as StudentItem[];
    return Array.isArray(data) ? data : [];
}

async function getBatches(): Promise<Batch[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/batches`, {
        cache: "no-store",
    }).catch(() => null);
    if (!res || !res.ok) return [];
    const data = (await res.json()) as Batch[];
    return Array.isArray(data) ? data : [];
}

export default async function Page() {
    const [rows, batches] = await Promise.all([getStudents(), getBatches()]);
    const batchNames = batches.map((b) => b.name);
    return <StudentList rows={rows} batches={batchNames} />;
}
