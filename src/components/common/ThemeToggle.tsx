"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <Button variant="ghost" size="icon" disabled className="size-9" />;
    }

    const isDark = resolvedTheme === "dark";

    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            className="size-9"
            onClick={() => setTheme(isDark ? "light" : "dark")}
        >
            {isDark ? <IconSun className="size-5" /> : <IconMoon className="size-5" />}
        </Button>
    );
}

export default ThemeToggle;
