"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { IconChartBar } from "@tabler/icons-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

type TrendRow = { date: string; present: number; absent: number };

const chartConfig: ChartConfig = {
    present: { label: "Present", color: "var(--chart-1)" },
    absent: { label: "Absent", color: "var(--chart-2)" },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export default function StudentAttendanceChart() {
    const [data, setData] = useState<TrendRow[] | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/statistics/attendance-trend?days=14", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load attendance trend");
                setData(await res.json());
            } catch {
                setData([]);
            }
        })();
    }, []);

    return (
        <Card className="mt-5">
            <CardHeader>
                <CardTitle>Attendance Trend</CardTitle>
                <CardDescription>Present vs Absent students over the last 14 days</CardDescription>
            </CardHeader>
            <CardContent>
                {data === null ? (
                    <Skeleton className="h-[300px] w-full" />
                ) : data.every((d) => d.present === 0 && d.absent === 0) ? (
                    <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-muted-foreground">
                        <IconChartBar className="size-10" />
                        <p className="text-sm">No attendance recorded yet</p>
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
                        <BarChart data={data}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value: string) => dateFormatter.format(new Date(value))}
                            />
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value) => dateFormatter.format(new Date(value as string))}
                                    />
                                }
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="present" stackId="a" fill="var(--color-present)" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="absent" stackId="a" fill="var(--color-absent)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
