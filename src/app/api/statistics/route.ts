// src/app/api/statistics/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
    try {
        const db = await getDb();

        // Count total students
        const totalStudents = await db.collection("students").countDocuments();

        // Count total teachers
        const totalTeachers = await db.collection("teachers").countDocuments();

        // Calculate today's date (YYYY-MM-DD)
        const today = new Date().toISOString().slice(0, 10);

        // Count present students (if you have attendance collection)
        let presentToday = 0;
        try {
            presentToday = await db
                .collection("attendance")
                .countDocuments({ date: today, status: "Present" });
        } catch {
            presentToday = 0; // fallback if no collection yet
        }

        // Sum total collected fees
        let totalFees = 0;
        try {
            const feesAgg = await db
                .collection("fees")
                .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
                .toArray();
            totalFees = feesAgg[0]?.total ?? 0;
        } catch {
            totalFees = 0;
        }

        // SMS balance (static or fetched via API later)
        const smsBalance = 1250;

        return NextResponse.json({
            totalStudents,
            presentToday,
            collectedFees: totalFees,
            totalTeachers,
            smsBalance,
        });
    } catch (e) {
        console.error("Error fetching statistics:", e);
        return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
    }
}
