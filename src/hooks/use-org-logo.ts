"use client";

import { useEffect, useState } from "react";
import { DEFAULT_ORG_LOGO } from "@/lib/org";

/** Fetches the admin-configured logo (Settings page), falling back to the
 *  default until it loads or if none has been set. */
export function useOrgLogo(): string {
    const [logo, setLogo] = useState<string>(DEFAULT_ORG_LOGO);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/logo", { cache: "no-store" });
                if (!res.ok) return;
                const data = (await res.json()) as { orgLogo?: string | null };
                if (data.orgLogo) setLogo(data.orgLogo);
            } catch {
                // keep default logo
            }
        })();
    }, []);

    return logo;
}
