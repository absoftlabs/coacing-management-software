"use client";

import { useState, type ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

/** Wraps SidebarProvider in fully-controlled mode. The App Router keeps this
 *  layout's client tree mounted across navigations while `RootLayout` (a
 *  dynamic server component reading the sidebar cookie) re-runs and can hand
 *  down a new `defaultOpen` value on every navigation — Base UI treats that
 *  as "changing the default state of an uncontrolled component" and warns.
 *  Owning the open state here, seeded once from the server value, sidesteps
 *  that entirely while SidebarProvider's own toggle handler keeps writing
 *  the cookie so the initial value still survives full page loads. */
export function SidebarStateProvider({
    defaultOpen,
    children,
}: {
    defaultOpen: boolean;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <SidebarProvider open={open} onOpenChange={setOpen}>
            {children}
        </SidebarProvider>
    );
}
