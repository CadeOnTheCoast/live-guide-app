"use client";

import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

export default function SidebarClient({ children }: { children: ReactNode }) {
    const { isCollapsed, toggleSidebar } = useSidebar();

    return (
        <aside
            className={cn(
                "relative hidden border-r bg-card transition-all duration-300 md:block",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            <div className={cn("flex flex-col h-full", isCollapsed ? "items-center px-2 py-6" : "px-4 py-6")}>
                <div className={cn("mb-6 flex items-center justify-between", isCollapsed && "justify-center")}>
                    {!isCollapsed && (
                        <div className="space-y-1">
                            <div className="text-lg font-semibold whitespace-nowrap">Projects</div>
                            <p className="text-xs text-muted-foreground">Choose a project</p>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className={cn("h-8 w-8", isCollapsed ? "" : "ml-2")}
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>
                <div className={cn("flex-1 space-y-4 overflow-hidden", isCollapsed && "hidden")}>
                    {children}
                </div>
            </div>
        </aside>
    );
}
