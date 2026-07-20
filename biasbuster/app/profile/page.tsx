// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, logout, logoutAll } from "@/lib/auth";
import { AUTH_CHANGED_EVENT } from "@/lib/auth-events";
import { Mail, ShieldCheck, ShieldAlert, LogOut, Monitor } from "lucide-react";

type User = {
    id?: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
    provider?: string;
    email_verified?: boolean;
    created_at?: string;
};

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<"logout" | "logout-all" | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            router.push("/authentication");
            return;
        }

        // Show cached user immediately, then refresh from the server.
        const cached = localStorage.getItem("user");
        if (cached) {
            try {
                setUser(JSON.parse(cached));
            } catch {
                // ignore malformed cache
            }
        }

        (async () => {
            try {
                const fresh = await getMe(token);
                setUser(fresh);
                localStorage.setItem("user", JSON.stringify(fresh));
            } catch (err) {
                console.error(err);
                setError("Couldn't load your profile. Please sign in again.");
            } finally {
                setLoading(false);
            }
        })();
    }, [router]);

    const handleLogout = async () => {
        setActionLoading("logout");
        try {
            const refresh = localStorage.getItem("refresh_token");
            if (refresh) await logout(refresh);
        } catch (err) {
            console.error(err);
        } finally {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
            window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
            router.push("/");
        }
    };

    const handleLogoutAll = async () => {
        setActionLoading("logout-all");
        try {
            const token = localStorage.getItem("access_token");
            if (token) await logoutAll(token);
        } catch (err) {
            console.error(err);
        } finally {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
            window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
            router.push("/");
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-slate-50 pt-20">
                <div className="text-sm font-mono text-slate-500">Loading profile…</div>
            </main>
        );
    }

    if (error || !user) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-slate-50 pt-20 px-4">
                <div className="text-center">
                    <p className="text-sm text-red-600">{error ?? "Something went wrong."}</p>
                    <button
                        onClick={() => router.push("/authentication")}
                        className="mt-4 text-sm font-semibold text-slate-900 hover:underline"
                    >
                        Back to sign in
                    </button>
                </div>
            </main>
        );
    }

    const initials = user.full_name
        ? user.full_name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
        : "?";

    return (
        <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28">
            <div className="mx-auto w-full max-w-2xl">
                <div className="overflow-hidden rounded-[28px] bg-white shadow-xl ring-1 ring-black/5">
                    {/* Header */}
                    <div className="relative h-28 bg-gradient-to-r from-slate-900 to-slate-700">
                        <div className="absolute -bottom-10 left-8">
                            {user.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={user.avatar_url}
                                    alt={user.full_name}
                                    className="size-20 rounded-full border-4 border-white object-cover shadow-md"
                                />
                            ) : (
                                <div className="flex size-20 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-xl font-semibold text-white shadow-md">
                                    {initials}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-8 pb-8 pt-14">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="font-serif text-2xl text-slate-900">{user.full_name}</h1>
                            {user.email_verified ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                    <ShieldCheck className="size-3.5" />
                                    Verified
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                                    <ShieldAlert className="size-3.5" />
                                    Unverified
                                </span>
                            )}
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                            <Mail className="size-3.5" />
                            {user.email}
                        </div>

                        {user.provider && (
                            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                                Signed in with {user.provider.toLowerCase()}
                            </div>
                        )}

                        <div className="mt-8 border-t border-slate-100 pt-6">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                                Session
                            </h2>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                <button
                                    onClick={handleLogout}
                                    disabled={actionLoading !== null}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition"
                                >
                                    <LogOut className="size-4" />
                                    {actionLoading === "logout" ? "Logging out…" : "Log out"}
                                </button>
                                <button
                                    onClick={handleLogoutAll}
                                    disabled={actionLoading !== null}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition"
                                >
                                    <Monitor className="size-4" />
                                    {actionLoading === "logout-all" ? "Logging out…" : "Log out of all devices"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}