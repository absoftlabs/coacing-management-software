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


// src/lib/types.ts

export type ResultType = "Class Test" | "Weekly Test" | "Quiz Test" | "Model Test" | "Custom";

export interface SubjectMark {
    className: string;
    mcqTotal?: number;  // e.g., 50
    mcqGain?: number;   // e.g., 40
    quesTotal?: number; // e.g., 50
    quesGain?: number;  // e.g., 35
    totalMarks?: number; // derived
    totalGain?: number;  // derived
}

export interface ResultDoc {
    _id?: string;       // client-facing id (string)
    batch: string;
    studentId: string;
    studentName: string;
    resultType: ResultType;
    examDate?: string;  // ISO string
    subjects: SubjectMark[]; // <-- multi-subject here
    totalMarks?: number; // sum over subjects
    totalGain?: number;  // sum over subjects
    createdAt?: string;
    updatedAt?: string;
}


// src/lib/types.ts
export type TeacherDoc = {
    _id?: string;                // string for client
    name: string;
    imageUrl?: string;
    primarySubject: string;
    joinDate?: string;           // ISO date (yyyy-mm-dd)
    salary?: number;
    isSuspended?: boolean;
    createdAt: string;
    updatedAt: string;
};

export type FeeDoc = {
    _id?: string;
    studentId: string;
    studentName: string;
    amount: number;
    depositBy: string;      // from parent/family dropdown
    receivedBy: string;     // text input
    createdAt: string;
    updatedAt: string;
};