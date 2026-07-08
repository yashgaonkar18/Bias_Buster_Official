// components/welcome-toast.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";

export function WelcomeToast() {
    const [visible, setVisible] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);

    useEffect(() => {
        const shouldShow = sessionStorage.getItem("show_welcome");
        if (!shouldShow) return;

        // Consume the flag immediately so refreshing/navigating back
        // doesn't show it again.
        sessionStorage.removeItem("show_welcome");

        try {
            const raw = localStorage.getItem("user");
            if (raw) {
                const user = JSON.parse(raw);
                setUserName(user?.full_name?.split(" ")[0] ?? null);
            }
        } catch {
            // ignore malformed user JSON
        }

        setVisible(true);

        const timer = setTimeout(() => setVisible(false), 6000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed top-24 left-1/2 z-[100] -translate-x-1/2 px-4 w-full max-w-md">
            <div className="flex items-start gap-3 rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-2xl ring-1 ring-black/10 animate-in fade-in slide-in-from-top-4 duration-300">
                <Sparkles className="mt-0.5 size-5 shrink-0 text-amber-300" />
                <div className="flex-1">
                    <p className="font-semibold">
                        Welcome{userName ? `, ${userName}` : ""}! 🎉
                    </p>
                    <p className="mt-0.5 text-sm text-white/70">
                        Your account is ready — you can start building something great.
                    </p>
                </div>
                <button
                    onClick={() => setVisible(false)}
                    aria-label="Dismiss"
                    className="shrink-0 text-white/50 hover:text-white transition"
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    );
}