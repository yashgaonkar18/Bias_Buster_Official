// app/reset-password/page.tsx
"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/auth";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError("This reset link is invalid or missing a token.");
            return;
        }

        const data = new FormData(e.currentTarget);
        const password = data.get("password") as string;
        const confirm = data.get("confirm") as string;

        if (password !== confirm) {
            setError("Passwords don't match.");
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, password);
            setDone(true);
            setTimeout(() => router.push("/authentication"), 2000);
        } catch (err) {
            console.error(err);
            setError("This reset link is invalid or has expired. Please request a new one.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="w-full max-w-md rounded-[28px] bg-white p-10 shadow-2xl ring-1 ring-black/5">
                <Logo />

                {done ? (
                    <div className="mt-8">
                        <h1 className="font-serif text-3xl leading-tight text-slate-900">
                            Password updated
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-slate-500">
                            Redirecting you to sign in…
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mt-8 mb-8">
                            <h1 className="font-serif text-3xl leading-tight text-slate-900">
                                Set a new password
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Choose a new password for your account.
                            </p>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                                    New password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    minLength={8}
                                    required
                                    placeholder="At least 8 characters"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Confirm password
                                </label>
                                <input
                                    id="confirm"
                                    name="confirm"
                                    type="password"
                                    minLength={8}
                                    required
                                    placeholder="Re-enter your new password"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                            </div>

                            {error && <p className="text-sm text-red-600">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition"
                            >
                                {loading ? "Updating…" : "Update password"}
                            </button>
                        </form>

                        <Link
                            href="/authentication"
                            className="mt-6 inline-block text-sm font-semibold text-slate-900 hover:underline"
                        >
                            ← Back to sign in
                        </Link>
                    </>
                )}
            </div>
        </main>
    );
}

function Logo() {
    return (
        <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-slate-900" />
                <path d="M7 12h10M9 8.5h6M9 15.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-900" />
            </svg>
            <span className="font-serif text-lg font-medium text-slate-900">BiasBuster</span>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen flex items-center justify-center bg-slate-100">
                    <div className="text-slate-600 font-mono">Loading…</div>
                </main>
            }
        >
            <ResetPasswordContent />
        </Suspense>
    );
}