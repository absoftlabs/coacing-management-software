"use client";

import { useTheme } from "@/hook/useTheme";
import { IconSun, IconMoon } from "@tabler/icons-react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme("forest");

    return (
        <label className="toggle toggle-xl text-base-content">
            <input type="checkbox"
                aria-label="Toggle theme"
                checked={theme === "cupcake"}
                onChange={() => setTheme(theme === "cupcake" ? "forest" : "cupcake")} />

            <IconMoon size={24} />
            <IconSun size={24} />
        </label>
    );
}
export default ThemeToggle;