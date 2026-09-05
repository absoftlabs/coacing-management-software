"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { IconLogout, IconSettings, IconUserCircle } from "@tabler/icons-react";
import ThemeToggle from "./ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrgLogo } from "@/hooks/use-org-logo";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getPageTitle } from "@/lib/nav";

function Header() {
    const [loggingOut, setLoggingOut] = useState(false);
    const logo = useOrgLogo();
    const user = useCurrentUser();
    const pathname = usePathname();
    const title = getPageTitle(pathname);

    async function handleLogout() {
        setLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        } catch {
            toast.error("Logout failed");
            setLoggingOut(false);
        }
    }

    return (
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <span className="text-lg font-semibold">{title}</span>

            <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />

                <DropdownMenu>
                    <DropdownMenuTrigger className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <Avatar className="ring-2 ring-border">
                            <AvatarImage src={logo} alt="Admin" />
                            <AvatarFallback>AD</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {user?.role !== "teacher" && (
                                <DropdownMenuItem render={<Link href="/settings" />}>
                                    <IconSettings className="size-4" />
                                    Settings
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem render={<Link href="/change-password" />}>
                                <IconUserCircle className="size-4" />
                                Change Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLogout} disabled={loggingOut} variant="destructive">
                                <IconLogout className="size-4" />
                                {loggingOut ? "Logging out..." : "Logout"}
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

export default Header;
