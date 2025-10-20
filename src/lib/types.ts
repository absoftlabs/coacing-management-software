// src/lib/types.ts

// Batch
export type BatchDoc = {
    _id?: string;
    name: string;
    createdAt: string;
    updatedAt: string;
};

// Class
export type ClassDoc = {
    _id?: string;
    name: string;
    code: string;
    teacher?: string;
    batch?: string;
    days?: string[];
    isActive?: boolean;
    createdAt: string;
    updatedAt: string;
};

// Student
export type Division = "Science" | "Humanities" | "Commerce";
export type Section = "A" | "B" | "C" | "D";
export type Gender = "Male" | "Female";

export type StudentDoc = {
    _id?: string;
    studentId: string; // PCC-xxxxx
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

    // ✅ new fields
    birthDate?: string;   // yyyy-mm-dd
    courseFee?: number;   // number (tk)

    createdAt: string;
    updatedAt: string;
};


// ====== Result ======
export type ResultDoc = {
    _id?: string;

    batch: string;              // batch name
    studentId: string;          // PCC-xxxxx
    studentName: string;        // denormalized for quick listing
    className: string;          // class/subject display name
    resultType: string;         // e.g. Class Test / Weekly Test / Custom etc.
    examDate?: string;          // yyyy-mm-dd

    mcqTotal?: number;
    mcqGain?: number;
    quesTotal?: number;
    quesGain?: number;

    // convenience (server-computed)
    totalMarks?: number;        // (mcqTotal || 0) + (quesTotal || 0)
    totalGain?: number;         // (mcqGain || 0) + (quesGain || 0)

    createdAt: string;
    updatedAt: string;
};

