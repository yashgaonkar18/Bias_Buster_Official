"use client";

import { useState, FormEvent } from "react";
import { useSearchParams ,useRouter } from "next/navigation";
import Link from "next/link";
import { login, signup, googleLogin, githubLogin } from "@/lib/auth";

type Mode = "login" | "signup";



export default function AuthPage() {
    const searchParams = useSearchParams();
    const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
    const [mode, setMode] = useState<Mode>(initialMode);
    

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4 md:p-6">
            <div className="w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-black/5 md:grid md:grid-cols-2">
                <VisualPanel mode={mode} />

                <div className="flex flex-col justify-center px-8 py-12 sm:px-14 lg:px-16">
                    <div className="mx-auto w-full max-w-sm">
                        <Logo />

                        <div className="mt-10 mb-8">
                            <h1 className="font-serif text-4xl leading-tight text-slate-900">
                                {mode === "login" ? "Welcome Back" : "Join BiasBuster Today"}
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">
                                {mode === "login"
                                    ? "Enter your email and password to access your account"
                                    : "Create an account to get started in less than a minute"}
                            </p>
                        </div>

                        {mode === "login" ? <LoginForm /> : <SignupForm />}

                        <div className="my-6 flex items-center gap-3">
                            <div className="h-px flex-1 bg-slate-200" />
                            <span className="text-xs uppercase tracking-wider text-slate-400">or</span>
                            <div className="h-px flex-1 bg-slate-200" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={googleLogin}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                <GoogleIcon />
                                Google
                            </button>
                            <button
                                type="button"
                                onClick={githubLogin}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                <GitHubIcon />
                                GitHub
                            </button>
                        </div>

                        <p className="mt-8 text-center text-sm text-slate-500">
                            {mode === "login" ? (
                                <>
                                    Don&apos;t have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={() => setMode("signup")}
                                        className="font-semibold text-slate-900 hover:underline"
                                    >
                                        Sign Up
                                    </button>
                                </>
                            ) : (
                                <>
                                    Already have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={() => setMode("login")}
                                        className="font-semibold text-slate-900 hover:underline"
                                    >
                                        Sign In
                                    </button>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}

function VisualPanel({ mode }: { mode: Mode }) {
    return (
        <div className="relative hidden min-h-[640px] overflow-hidden bg-[#08060d] md:block">
            {/* ambient wave gradient */}
            <div className="absolute inset-0">
                <div className="absolute -left-1/4 top-[-10%] h-[140%] w-[160%] rotate-[-8deg] opacity-90 blur-[2px]"
                    style={{
                        background:
                            "conic-gradient(from 210deg at 30% 40%, #ff2f8f 0deg, #7b2ff7 90deg, #2fb8ff 160deg, #08060d 220deg, #ff2f8f 360deg)",
                    }}
                />
                <div className="absolute inset-0 mix-blend-overlay"
                    style={{
                        background:
                            "radial-gradient(120% 90% at 15% 85%, rgba(0,0,0,0.9), transparent 60%)",
                    }}
                />
                <div className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(180deg, rgba(8,6,13,0.15) 0%, rgba(8,6,13,0.05) 45%, rgba(8,6,13,0.85) 100%)",
                    }}
                />
            </div>

            {/* content */}
            <div className="relative z-10 flex h-full flex-col justify-between p-10">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold tracking-[0.2em] text-white/80">
                        FAIR AI STARTS HERE
                    </span>
                    <span className="h-px w-16 bg-white/40" />
                </div>

                <div className="max-w-sm">
                    <h2 className="font-serif text-4xl leading-[1.1] text-white">
                        Get
                        <br />
                        Everything
                        <br />
                        You Want
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-white/70">
                        Empower ethical AI by identifying bias, improving fairness, and building trustworthy machine learning systems.
                    </p>
                </div>
            </div>
        </div>
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

function LoginForm() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setLoading(true);
        try {
            const result = await login({
                email: data.get("email") as string,
                password: data.get("password") as string,
            });

            localStorage.setItem("access_token", result.access_token);
            localStorage.setItem("refresh_token", result.refresh_token);
            localStorage.setItem("user", JSON.stringify(result.user));
            console.log(result);
            router.push("/");
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <Field label="Email" name="email" type="email" placeholder="Enter your email" required />
            <PasswordField label="Password" name="password" placeholder="Enter your password" required />
            <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" name="remember" className="rounded border-slate-300" />
                    Remember me
                </label>
                <Link href="/reset-password" className="text-slate-500 hover:text-slate-900 hover:underline">
                    Forgot Password
                </Link>
            </div>
            <SubmitButton loading={loading}>Sign In</SubmitButton>
        </form>
    );
}

function SignupForm() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setLoading(true);
        try {
            const result = await signup({
                full_name: data.get("name") as string,
                email: data.get("email") as string,
                password: data.get("password") as string,
            });

            localStorage.setItem("access_token", result.access_token);
            localStorage.setItem("refresh_token", result.refresh_token);
            localStorage.setItem("user", JSON.stringify(result.user));
            console.log(result);
            router.push("/");
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <Field label="Full name" name="name" type="text" placeholder="Jane Doe" required />
            <Field label="Email" name="email" type="email" placeholder="Enter your email" required />
            <PasswordField
                label="Password"
                name="password"
                placeholder="At least 8 characters"
                minLength={8}
                required
            />
            <label className="flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" required className="mt-0.5 rounded border-slate-300" />
                <span>
                    I agree to the <a href="#" className="font-medium text-slate-900 hover:underline">Terms</a> and{" "}
                    <a href="#" className="font-medium text-slate-900 hover:underline">Privacy Policy</a>.
                </span>
            </label>
            <SubmitButton loading={loading}>Create account</SubmitButton>
        </form>
    );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    const { label, id, name, ...rest } = props;
    const inputId = id ?? name;
    return (
        <div>
            <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}
            </label>
            <input
                id={inputId}
                name={name}
                {...rest}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
        </div>
    );
}

function PasswordField(
    props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }
) {
    const { label, id, name, ...rest } = props;
    const inputId = id ?? name;
    const [visible, setVisible] = useState(false);

    return (
        <div>
            <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}
            </label>
            <div className="relative">
                <input
                    id={inputId}
                    name={name}
                    type={visible ? "text" : "password"}
                    {...rest}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                    <EyeIcon open={visible} />
                </button>
            </div>
        </div>
    );
}

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition"
        >
            {loading ? "Please wait…" : children}
        </button>
    );
}

function EyeIcon({ open }: { open: boolean }) {
    if (open) {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 3l18 18M10.6 10.7a2.5 2.5 0 003.5 3.5M6.6 6.7C4.4 8.2 2.9 10.3 2 12c1.6 3.4 5.1 7 10 7 1.6 0 3-.3 4.3-.9M9.6 4.4A10.6 10.6 0 0112 4c4.9 0 8.4 3.6 10 7-.5 1-1.1 2-1.9 2.9"
                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M2 12c1.6-3.4 5.1-7 10-7s8.4 3.6 10 7c-1.6 3.4-5.1 7-10 7s-8.4-3.6-10-7z"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
        </svg>
    );
}

function GitHubIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor">
            <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.207 11.387.6.113.793-.26.793-.577 0-.285-.01-1.04-.016-2.04-3.338.725-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.42-1.305.763-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.807 5.624-5.479 5.921.43.372.814 1.103.814 2.222 0 1.604-.014 2.898-.014 3.293 0 .319.192.694.801.576C20.566 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2c-.3 1.5-1.1 2.7-2.4 3.5v2.9h3.9c2.3-2.1 3.6-5.2 3.6-8.6z" />
            <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-2.9c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3C3.4 21.3 7.4 24 12 24z" />
            <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.6H1.4C.5 8.3 0 10.1 0 12s.5 3.7 1.4 5.4l4-3z" />
            <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.6l4 3C6.3 6.9 8.9 4.8 12 4.8z" />
        </svg>
    );
}