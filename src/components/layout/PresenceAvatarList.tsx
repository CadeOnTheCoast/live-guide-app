"use client";

import { PresenceUser } from "@/lib/supabase/usePresence";
import { cn } from "@/lib/utils";

// Note: Ensure Tooltip components exist or use a simple alternative if not.
// For now, I'll implement a clean version and we can adjust if Lucide/UI is missing.

type PresenceAvatarListProps = {
    users: PresenceUser[];
    maxDisplay?: number;
};

export function PresenceAvatarList({ users, maxDisplay = 4 }: PresenceAvatarListProps) {
    if (users.length === 0) return null;

    const displayUsers = users.slice(0, maxDisplay);
    const overflowCount = users.length - maxDisplay;

    return (
        <div className="flex -space-x-2 items-center">
            {displayUsers.map((user) => (
                <div
                    key={user.email}
                    className={cn(
                        "relative group rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-brand-sky/10",
                        user.color,
                        "h-7 w-7"
                    )}
                    title={user.name}
                >
                    {user.initials}

                    {/* Simple toolip fallback if shadcn-ui tooltip isn't in scope */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-brand-charcoal text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-[100] shadow-xl border border-white/20">
                        {user.name}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-brand-charcoal"></div>
                    </div>
                </div>
            ))}

            {overflowCount > 0 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-sage/20 text-[10px] font-bold text-brand-charcoal shadow-sm ring-1 ring-brand-sky/10">
                    +{overflowCount}
                </div>
            )}
        </div>
    );
}
