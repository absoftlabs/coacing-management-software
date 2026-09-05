"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
    IconSchool,
    IconUser,
    IconCash,
    IconChalkboard,
    IconMessageCircle,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StatsData = {
    totalStudents: number;
    presentToday: number;
    collectedFees: number;
    totalTeachers: number;
    smsBalance: number;
};

const COLORS = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
} as const;

function StatCard({
    title,
    value,
    subtitle,
    icon,
    color,
    loading,
}: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: ReactNode;
    color: keyof typeof COLORS;
    loading: boolean;
}) {
    return (
        <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
                    {loading ? (
                        <Skeleton className="mt-1.5 h-8 w-16" />
                    ) : (
                        <p className="text-3xl font-bold tracking-tight">{value}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
                <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", COLORS[color])}>
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}

export default function StatisticsCard() {
    const [stats, setStats] = useState<StatsData>({
        totalStudents: 0,
        presentToday: 0,
        collectedFees: 0,
        totalTeachers: 0,
        smsBalance: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/statistics", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load stats");
                setStats(await res.json());
            } catch (e) {
                console.error("Stats fetch error:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Total Students" value={stats.totalStudents} subtitle="Enrolled" icon={<IconUser className="size-5" />} color="blue" loading={loading} />
            <StatCard title="Present Today" value={stats.presentToday} subtitle="Students" icon={<IconSchool className="size-5" />} color="emerald" loading={loading} />
            <StatCard title="Collected Fees" value={`৳ ${stats.collectedFees}`} subtitle="Tuition Fees" icon={<IconCash className="size-5" />} color="amber" loading={loading} />
            <StatCard title="Total Teachers" value={stats.totalTeachers} subtitle="Faculty" icon={<IconChalkboard className="size-5" />} color="violet" loading={loading} />
            <StatCard title="SMS Balance" value={`৳ ${stats.smsBalance}`} subtitle="Remaining" icon={<IconMessageCircle className="size-5" />} color="pink" loading={loading} />
        </div>
    );
}
