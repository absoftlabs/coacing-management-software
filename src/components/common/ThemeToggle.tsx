"use client";

import { useTheme } from "@/hook/useTheme";
import { IconSun, IconMoon } from "@tabler/icons-react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme("cupcake");

    return (
        <label className="toggle toggle-xl text-base-content">
            <input type="checkbox"
                aria-label="Toggle theme"
                checked={theme === "dark"}
                onChange={() => setTheme(theme === "dark" ? "cupcake" : "dark")} />

            <IconMoon size={24} />
            <IconSun size={24} />
        </label>
    );
}
export default ThemeToggle;