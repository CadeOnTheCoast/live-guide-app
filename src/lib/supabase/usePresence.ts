"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type PresenceUser = {
    email: string;
    name: string;
    initials: string;
    color: string;
};

/**
 * Hook to track active users on a specific project page using Supabase Presence.
 */
export function usePresence(slug: string, currentUser?: { email: string; name: string } | null) {
    const [users, setUsers] = useState<PresenceUser[]>([]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    const getDeterministicColor = (email: string) => {
        const colors = [
            "bg-blue-500",
            "bg-emerald-500",
            "bg-amber-500",
            "bg-rose-500",
            "bg-indigo-500",
            "bg-teal-500",
            "bg-orange-500",
            "bg-pink-500",
            "bg-cyan-500",
            "bg-violet-500",
        ];
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            hash = email.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash % colors.length);
        return colors[index];
    };

    useEffect(() => {
        if (!slug || !currentUser) return;

        const supabase = createSupabaseBrowserClient();
        const channel = supabase.channel(`project:${slug}`, {
            config: {
                presence: {
                    key: currentUser.email,
                },
            },
        });

        const presenceState: PresenceUser = {
            email: currentUser.email,
            name: currentUser.name,
            initials: getInitials(currentUser.name),
            color: getDeterministicColor(currentUser.email),
        };

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const activeUsers: PresenceUser[] = Object.values(state).flatMap(
                    (presences: unknown) => (presences as PresenceUser[])[0]
                );

                // Filter out duplicate emails (though key: email handles this mostly)
                const uniqueUsers = activeUsers.filter(
                    (user, index, self) =>
                        index === self.findIndex((u) => u.email === user.email)
                );

                setUsers(uniqueUsers);
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track(presenceState);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [slug, currentUser?.email, currentUser?.name, currentUser]);

    return users;
}
