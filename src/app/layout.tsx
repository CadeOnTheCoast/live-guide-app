import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Live Guide",
  description: "Mobile Baykeeper Live Guide dashboard"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen">
          <aside className="hidden w-52 border-r bg-card px-4 py-6 md:block">
            <div className="text-lg font-semibold">Navigation</div>
            <p className="mt-2 text-sm text-muted-foreground">Space for project shortcuts</p>
          </aside>
          <div className="flex flex-1 flex-col">
            <header className="flex items-center justify-between border-b bg-white px-6 py-4">
              <h1 className="text-xl font-bold">Live Guide</h1>
              <div className={cn("rounded-md bg-secondary px-3 py-1 text-sm text-secondary-foreground")}>
                User placeholder
              </div>
            </header>
            <main className="flex-1 bg-muted/40 px-4 py-6 md:px-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
