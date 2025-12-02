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
        <main className={cn("min-h-screen bg-muted/40")}>{children}</main>
      </body>
    </html>
  );
}
