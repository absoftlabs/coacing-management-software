// src/app/api/statistics/attendance-trend/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function ymd(d: Date): string {
    return d.toISOString().slice(0, 10);
}

// GET /api/statistics/attendance-trend?days=14
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const days = Math.min(60, Math.max(1, Number(searchParams.get("days")) || 14));

        const today = new Date();
        const dateList: string[] = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            dateList.push(ymd(d));
        }

        const startDate = dateList[0];

        const grouped = await prisma.attendance.groupBy({
            by: ["date", "status"],
            where: { date: { gte: startDate } },
            _count: { _all: true },
        });

        const counts = new Map<string, { present: number; absent: number }>();
        for (const g of grouped) {
            const entry = counts.get(g.date) ?? { present: 0, absent: 0 };
            if (g.status === "Present") entry.present = g._count._all;
            else if (g.status === "Absent") entry.absent = g._count._all;
            counts.set(g.date, entry);
        }

        const rows = dateList.map((date) => ({
            date,
            present: counts.get(date)?.present ?? 0,
            absent: counts.get(date)?.absent ?? 0,
        }));

        return NextResponse.json(rows);
    } catch (error) {
        console.error("GET /api/statistics/attendance-trend error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
