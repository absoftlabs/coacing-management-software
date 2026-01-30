// src/app/result-list/page.tsx
import ResultList from "@/components/Result/ResultList";
import type { ResultDoc } from "@/lib/types";
import { api } from "@/lib/baseUrl";

// safe fetch->json helper (server-side)
async function safeJson<T>(p: Promise<Response>, fallback: T): Promise<T> {
    try {
        const res = await p;
        if (!res.ok) return fallback;
        return (await res.json()) as T;
    } catch {
        return fallback;
    }
}

export default async function Page() {
    // fetch in parallel; each falls back to []
    const [rowsRaw, batchesRaw, classesRaw] = await Promise.all([
        safeJson<ResultDoc[]>(api("/api/results", { cache: "no-store" }), []),
        safeJson<Array<{ _id?: string; name: string }>>(
            api("/api/batches", { cache: "no-store" }),
            []
        ),
        safeJson<Array<{ _id?: string; name: string }>>(
            api("/api/classes", { cache: "no-store" }),
            []
        ),
    ]);

    // ensure arrays of strings
    const rows: ResultDoc[] = Array.isArray(rowsRaw) ? rowsRaw : [];
    const batches: string[] = Array.isArray(batchesRaw)
        ? batchesRaw.map((b) => b?.name).filter(Boolean)
        : [];
    const classes: string[] = Array.isArray(classesRaw)
        ? classesRaw.map((c) => c?.name).filter(Boolean)
        : [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Result List</h1>
            <ResultList rows={rows} batches={batches} classes={classes} />
        </div>
    );
}
