"use client";

import React, { useEffect, useState } from "react";
import {
    IconSchool,
    IconUser,
    IconCash,
    IconChalkboard,
    IconMessageCircle,
} from "@tabler/icons-react";

type StatsData = {
    totalStudents: number;
    presentToday: number;
    collectedFees: number;
    totalTeachers: number;
    smsBalance: number;
};

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
        async function fetchStats() {
            try {
                const res = await fetch("/api/statistics");
                if (!res.ok) throw new Error("Failed to load stats");
                const data = await res.json();
                setStats(data);
            } catch (e) {
                console.error("Stats fetch error:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const StatCard = ({
        title,
        value,
        subtitle,
        icon,
        color,
    }: {
        title: string;
        value: string | number;
        subtitle: string;
        icon: React.ReactNode;
        color: string;
    }) => (
        <div className="col-span-10 md:col-span-5 lg:col-span-2">
            <div className="flex justify-between items-center p-4 rounded-lg shadow-md bg-base-200">
                <div className="text-base-content">
                    <h4 className="font-semibold">{title}</h4>
                    <p className="text-3xl font-bold">
                        {loading ? "..." : value}
                    </p>
                    <small>{subtitle}</small>
                </div>
                <div className={`p-2 rounded ${color}`}>{icon}</div>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-10 gap-5 justify-between items-center">
            <StatCard
                title="Total Students"
                value={stats.totalStudents}
                subtitle="Enrolled"
                icon={<IconUser />}
                color="bg-primary text-primary-content"
            />
            <StatCard
                title="Present Today"
                value={stats.presentToday}
                subtitle="Students"
                icon={<IconSchool />}
                color="bg-secondary text-secondary-content"
            />
            <StatCard
                title="Collected Fees"
                value={`৳ ${stats.collectedFees}`}
                subtitle="Tuition Fees"
                icon={<IconCash />}
                color="bg-accent text-accent-content"
            />
            <StatCard
                title="Total Teachers"
                value={stats.totalTeachers}
                subtitle="Class 6-10"
                icon={<IconChalkboard />}
                color="bg-info text-info-content"
            />
            <StatCard
                title="SMS Balance"
                value={`৳ ${stats.smsBalance}`}
                subtitle="Remaining"
                icon={<IconMessageCircle />}
                color="bg-warning text-warning-content"
            />
        </div>
    );
}
