// lib/types.ts
export type ClassDoc = {
    _id?: string;
    name: string;
    code: string;
    teacher?: string;
    batch?: string;       // <- renamed from room
    days?: string[];
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
};


// lib/types.ts
export type BatchDoc = {
    _id?: string;
    name: string;        // unique
    createdAt?: string;
    updatedAt?: string;
};

export type BatchRow = {
    _id: string;
    name: string;
    totalClass: number;
    totalStudent: number;
};

// lib/types.ts
export type StudentDoc = {
    _id?: string;
    studentId: string;       // e.g. "PCC-12345" (random 5 digits)
    name: string;
    batch: string;
    roll: string;
    division?: "Science" | "Humanities" | "Commerce";
    schoolName?: string;
    schoolRoll?: string;
    schoolSection?: "A" | "B" | "C" | "D";
    address?: string;
    fatherName?: string;
    motherName?: string;
    guardianName?: string;
    guardianPhone?: string;
    gender?: "Male" | "Female";
    photoUrl?: string;       // <- NEW (optional data URL)
    isSuspended?: boolean;
    createdAt?: string;
    updatedAt?: string;
};


