import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/common/Sidebar";
import Header from "@/components/common/Header";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🔑 Single source of truth for the storage key
const THEME_STORAGE_KEY = "theme";

export const metadata: Metadata = {
  title: "Coaching Management Software",
  description: "A web application to manage coaching students and teachers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="forest">
      <head>
        {/* Pre-hydration theme script to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var k = ${JSON.stringify(THEME_STORAGE_KEY)};
    var t = localStorage.getItem(k);
    if(!t){
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {}
})();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="grid grid-cols-12 min-h-dvh">
          <aside className="col-span-12 md:col-span-2 hidden md:block">
            <Sidebar />
          </aside>
          <div className="col-span-12 md:col-span-10">
            <Header />
            <main className="p-4 lg:p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
