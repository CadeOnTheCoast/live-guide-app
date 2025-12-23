import type { Metadata } from "next";
import { Rajdhani, Montserrat } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Live Guide",
  description: "Mobile Baykeeper Live Guide dashboard"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn(rajdhani.variable, montserrat.variable)}>
      <body className="min-h-screen bg-background text-foreground font-montserrat">
        <main className={cn("min-h-screen bg-muted/40")}>{children}</main>
      </body>
    </html>
  );
}
