"use client";

import { useEffect, useCallback, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/**
 * Custom hook to subscribe to Supabase Realtime changes for timeline-related tables.
 * When a change is detected, it triggers a router.refresh() to refetch RSC data.
 */
export function useTimelineRealtime() {
    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleRefresh = useCallback(() => {
        // Debounce the refresh to avoid spamming server requests during bulk updates
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            console.log("[Realtime] Change detected, refreshing timeline...");
            router.refresh();
        }, 500); // 500ms debounce
    }, [router]);

    useEffect(() => {
        const supabase = createSupabaseBrowserClient();

        const channel = supabase
            .channel("timeline-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "Milestone" },
                handleRefresh
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "Push" },
                handleRefresh
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "KeyResult" },
                handleRefresh
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "Project" },
                handleRefresh
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.log("[Realtime] Subscribed to timeline changes");
                }
            });

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            supabase.removeChannel(channel);
        };
    }, [handleRefresh]);
}
