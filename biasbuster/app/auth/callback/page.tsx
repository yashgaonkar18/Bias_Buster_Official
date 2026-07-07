// app/auth/callback/page.tsx
//
// This page is where your backend should redirect to after a successful
// Google/GitHub OAuth login, e.g.:
//   http://localhost:3000/auth/callback?access_token=...&refresh_token=...
//
// Adjust the query param names below (ACCESS, REFRESH) to match whatever
// your FastAPI OAuth route actually sends in its RedirectResponse.

"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMe } from "@/lib/auth";
import { AUTH_CHANGED_EVENT } from "@/lib/auth-events";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const run = async () => {
            const access_token = searchParams.get("access_token");
            const refresh_token = searchParams.get("refresh_token");

            if (!access_token || !refresh_token) {
                console.error("OAuth callback missing tokens");
                router.push("/authentication");
                return;
            }

            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);

            try {
                const user = await getMe(access_token);
                localStorage.setItem("user", JSON.stringify(user));
            } catch (err) {
                console.error("Failed to fetch user after OAuth login", err);
            }

            // Same-tab components (like the Navbar) won't see the
            // localStorage change on their own — this event tells them to
            // re-check auth state right now, without a full page reload.
            window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));

            router.push("/");
        };

        run();
    }, [router, searchParams]);

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="text-slate-600 font-mono">Signing you in...</div>
        </main>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen flex items-center justify-center bg-slate-100">
                    <div className="text-slate-600 font-mono">Signing you in...</div>
                </main>
            }
        >
            <CallbackContent />
        </Suspense>
    );
}