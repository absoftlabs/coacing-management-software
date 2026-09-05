"use client";

import { useEffect, useState } from "react";

export type CurrentUser = { role: "admin" | "teacher"; username: string } | null;

/** Fetches the logged-in user's role so the UI can hide admin-only nav and
 *  menu items for a teacher account. Server-side middleware is the real
 *  access-control boundary; this only avoids showing links a teacher can't use. */
export function useCurrentUser(): CurrentUser {
    const [user, setUser] = useState<CurrentUser>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/auth/me", { cache: "no-store" });
                if (!res.ok) return;
                const data = (await res.json()) as { admin?: CurrentUser };
                if (data.admin) setUser(data.admin);
            } catch {
                // keep default (treated as admin-nav until resolved)
            }
        })();
    }, []);

    return user;
}
