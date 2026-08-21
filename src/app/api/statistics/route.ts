// src/app/api/statistics/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSmsBalance } from "@/lib/sms/smsNetClient";

export async function GET() {
    try {
        const totalStudents = await prisma.student.count();
        const totalTeachers = await prisma.teacher.count();

        const today = new Date().toISOString().slice(0, 10);

        let presentToday = 0;
        try {
            presentToday = await prisma.attendance.count({ where: { date: today, status: "Present" } });
        } catch {
            presentToday = 0;
        }

        let totalFees = 0;
        try {
            const agg = await prisma.fee.aggregate({ _sum: { amount: true } });
            totalFees = agg._sum.amount ?? 0;
        } catch {
            totalFees = 0;
        }

        let smsBalance = 0;
        try {
            const bal = await getSmsBalance();
            smsBalance = Number(bal) || 0;
        } catch {
            smsBalance = 0;
        }

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
