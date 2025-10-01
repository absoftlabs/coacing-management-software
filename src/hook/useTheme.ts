"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";

export function useTheme(defaultTheme: string = "forest") {
    const [theme, setTheme] = useState<string>(defaultTheme);

    // On mount, sync with localStorage or system
    useEffect(() => {
        if (typeof window === "undefined") return;

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setTheme(stored);
            document.documentElement.setAttribute("data-theme", stored);
        } else {
            // fallback: system preference
            const systemTheme = window.matchMedia("(prefers-color-scheme: forest)").matches
                ? "forest"
                : "cupcake";
            setTheme(systemTheme);
            document.documentElement.setAttribute("data-theme", systemTheme);
        }
    }, []);

    // Apply & persist when theme changes
    useEffect(() => {
        if (!theme) return;
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    return { theme, setTheme };
}
