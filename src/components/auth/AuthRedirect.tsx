"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Handles cases where Supabase redirects to the "Site URL" (homepage) 
 * instead of the intended callback URL by catching the `code` parameter.
 */
export function AuthRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get("code");

    useEffect(() => {
        if (code) {
            // Small delay to ensure the browser has time to settle
            const timeout = setTimeout(() => {
                router.replace(`/auth/callback?code=${code}`);
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [code, router]);

    return null;
}
