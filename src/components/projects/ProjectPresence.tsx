"use client";

import { usePresence } from "@/lib/supabase/usePresence";
import { PresenceAvatarList } from "../layout/PresenceAvatarList";

type ProjectPresenceProps = {
    slug: string;
    currentUser?: {
        email: string;
        name: string;
    } | null;
};

export function ProjectPresence({ slug, currentUser }: ProjectPresenceProps) {
    const users = usePresence(slug, currentUser);

    if (users.length === 0) return null;

    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-sage bg-brand-sky/10 px-2 py-0.5 rounded">
                ACTIVE NOW
            </span>
            <PresenceAvatarList users={users} />
        </div>
    );
}
