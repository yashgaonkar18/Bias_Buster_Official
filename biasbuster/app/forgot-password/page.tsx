// app/forgot-password/page.tsx
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/auth";

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const data = new FormData(e.currentTarget);
        const email = data.get("email") as string;

        setLoading(true);
        try {
            await forgotPassword(email);
            // Always show the success state, whether or not the email
            // exists — the backend already avoids leaking that info.
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="w-full max-w-md rounded-[28px] bg-white p-10 shadow-2xl ring-1 ring-black/5">
                <Logo />

                {submitted ? (
                    <div className="mt-8">
                        <h1 className="font-serif text-3xl leading-tight text-slate-900">
                            Check your email
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-slate-500">
                            If an account exists for that email address, we&apos;ve sent
                            a link to reset your password. It may take a minute to
                            arrive — don&apos;t forget to check spam.
                        </p>
                        <Link
                            href="/authentication"
                            className="mt-8 inline-block text-sm font-semibold text-slate-900 hover:underline"
                        >
                            ← Back to sign in
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mt-8 mb-8">
                            <h1 className="font-serif text-3xl leading-tight text-slate-900">
                                Forgot password?
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Enter the email linked to your account and we&apos;ll send
                                you a link to reset your password.
                            </p>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-5">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-600">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition"
                            >
                                {loading ? "Sending…" : "Send reset link"}
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