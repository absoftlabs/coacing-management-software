"use client";

import { useMemo, useState, type ReactNode } from "react";
import { IconSearch } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export type DataTableColumn<T> = {
    key: string;
    header: ReactNode;
    cell: (row: T, index: number) => ReactNode;
    className?: string;
};

type DataTableProps<T> = {
    rows: T[];
    columns: DataTableColumn<T>[];
    rowKey: (row: T) => string;
    searchPlaceholder?: string;
    filterRow?: (row: T, query: string) => boolean;
    emptyMessage?: string;
    toolbarRight?: ReactNode;
};

export function DataTable<T>({
    rows,
    columns,
    rowKey,
    searchPlaceholder = "Search...",
    filterRow,
    emptyMessage = "No records found",
    toolbarRight,
}: DataTableProps<T>) {
    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
        if (!filterRow || !q.trim()) return rows;
        const query = q.trim().toLowerCase();
        return rows.filter((row) => filterRow(row, query));
    }, [rows, q, filterRow]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {filterRow ? (
                    <div className="relative w-full sm:max-w-xs">
                        <IconSearch className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-8"
                            placeholder={searchPlaceholder}
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>
                ) : (
                    <div />
                )}
                {toolbarRight}
            </div>

            <div className="overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((c) => (
                                <TableHead key={c.key} className={c.className}>
                                    {c.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length ? (
                            filtered.map((row, i) => (
                                <TableRow key={rowKey(row)}>
                                    {columns.map((c) => (
                                        <TableCell key={c.key} className={c.className}>
                                            {c.cell(row, i)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
