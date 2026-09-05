"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, isNavGroup, getNavForRole } from "@/lib/nav";
import { useOrgLogo } from "@/hooks/use-org-logo";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
    Sidebar as SidebarRoot,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

function groupContainsPath(entry: { items: { href: string }[] }, pathname: string) {
    return entry.items.some((i) => i.href === pathname);
}

export function AppSidebar() {
    const pathname = usePathname();
    const logo = useOrgLogo();
    const user = useCurrentUser();
    const nav = getNavForRole(user?.role);

    // Controlled per-group open state (seeded once) instead of Collapsible's
    // own `defaultOpen`, which would otherwise be recomputed from `pathname`
    // on every navigation while this component stays mounted — Base UI warns
    // when an uncontrolled component's default value changes after init.
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        for (const entry of NAV) {
            if (isNavGroup(entry)) initial[entry.label] = groupContainsPath(entry, pathname);
        }
        return initial;
    });

    // Auto-expand (never auto-collapse) the group containing the active page
    // when navigating there via a route that didn't originate from clicking
    // its own trigger.
    useEffect(() => {
        setOpenGroups((prev) => {
            let changed = false;
            const next = { ...prev };
            for (const entry of NAV) {
                if (isNavGroup(entry) && groupContainsPath(entry, pathname) && !next[entry.label]) {
                    next[entry.label] = true;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [pathname]);

    return (
        <SidebarRoot collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center gap-2.5 px-2 py-2">
                    <Image
                        src={logo}
                        alt="Logo"
                        width={36}
                        height={36}
                        unoptimized
                        className="size-9 shrink-0 rounded-xl object-cover shadow-sm"
                    />
                    <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="font-semibold">Admin Panel</span>
                        <span className="text-xs text-muted-foreground">Coaching Manager</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {nav.map((entry) =>
                                isNavGroup(entry) ? (
                                    <Collapsible
                                        key={entry.label}
                                        open={openGroups[entry.label] ?? false}
                                        onOpenChange={(open) =>
                                            setOpenGroups((prev) => ({ ...prev, [entry.label]: open }))
                                        }
                                        className="group/collapsible"
                                    >
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger render={<SidebarMenuButton tooltip={entry.label} />}>
                                                <entry.icon />
                                                <span>{entry.label}</span>
                                                <IconChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub>
                                                    {entry.items.map((item) => (
                                                        <SidebarMenuSubItem key={item.href + item.label}>
                                                            <SidebarMenuSubButton
                                                                isActive={pathname === item.href}
                                                                render={<Link href={item.href} />}
                                                            >
                                                                <item.icon />
                                                                <span>{item.label}</span>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    ))}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                ) : (
                                    <SidebarMenuItem key={entry.href}>
                                        <SidebarMenuButton
                                            isActive={pathname === entry.href}
                                            tooltip={entry.label}
                                            render={<Link href={entry.href} />}
                                        >
                                            <entry.icon />
                                            <span>{entry.label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </SidebarRoot>
    );
}

export default AppSidebar;
