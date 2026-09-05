import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppSidebar from "@/components/common/Sidebar";
import Header from "@/components/common/Header";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { ConfirmProvider } from "@/components/shared/ConfirmDialog";
import { SidebarStateProvider } from "@/components/common/SidebarStateProvider";
import { SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { cookies, headers } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Coaching Management Software",
  description: "A web application to manage coaching students and teachers.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const headerAuthed = h.get("x-authenticated") === "1";
  const c = await cookies();
  const token = c.get("cms_token")?.value;
  const cookieAuthed = token ? (await verifyAuthToken(token)) !== null : false;
  const isAuthed = headerAuthed || cookieAuthed;
  const sidebarOpen = c.get("sidebar_state")?.value !== "false";

  return (
    <html lang="en" suppressHydrationWarning className={`${fontSans.variable} ${fontMono.variable}`}>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ConfirmProvider>
            {isAuthed ? (
              <SidebarStateProvider defaultOpen={sidebarOpen}>
                <AppSidebar />
                <SidebarInset>
                  <Header />
                  <main className="p-4 lg:p-8">{children}</main>
                </SidebarInset>
              </SidebarStateProvider>
            ) : (
              <main className="min-h-dvh">{children}</main>
            )}
            <Toaster richColors position="top-right" />
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
