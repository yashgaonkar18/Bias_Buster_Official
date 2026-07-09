"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logout, logoutAll, getMe } from "@/lib/auth";
import { AUTH_CHANGED_EVENT } from "@/lib/auth-events";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brain, Menu, ChevronRight, ChevronDown, Mail, ShieldCheck, ShieldAlert, LogOut, Monitor } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type User = {
  full_name: string;
  email: string;
  avatar_url?: string | null;
  provider?: string;
  email_verified?: boolean;
};

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [pathname, checkAuth]);

  useEffect(() => {
    window.addEventListener(AUTH_CHANGED_EVENT, checkAuth);
    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");

      if (refresh) {
        await logout(refresh);
      }
    } catch (error) {
      console.error(error);
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    setIsAuthenticated(false);

    router.push("/");
  };

  const navItems = [
    { label: "Docs", href: "#docs" },
    { label: "Blog", href: "#blog" },
    { label: "Tutorials", href: "#tutorials" },
    { label: "Workspace", href: "/dashboard" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full py-4 md:py-6">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-8 flex items-center justify-center text-foreground">
            <Brain className="size-8 stroke-[2.5]" />
          </div>
          <span className="font-display text-xl tracking-wider text-foreground uppercase">
            BiasBuster
          </span>
        </Link>

        {/* Center: Floating Nav Pill */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="bg-[#E5E5E5] backdrop-blur-md px-2 py-1.5 rounded-md flex items-center gap-1 shadow-sm border border-white/50">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-1.5 text-[11px] font-jetbrains  text-muted-foreground hover:text-foreground hover:bg-white/60 rounded-sm transition-all uppercase tracking-wide"
                data-testid={`link-nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-6 font-jetbrains text-xs font-bold uppercase tracking-wide">
          {isAuthenticated ? (
            <>
              <ProfileMenu onLoggedOut={handleLogout} />
            </>
          ) : (
            <>
              <Link
                href="/authentication"
                className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
              >
                <ChevronRight className="size-3" />
                Login
              </Link>

              <Button
                asChild
                size="sm"
                className="h-9 px-5 rounded-sm bg-foreground text-background hover:bg-foreground/90 font-bold tracking-wider"
              >
                <Link href="/authentication?mode=signup">
                  <ChevronRight className="size-3 mr-1" />
                  Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Nav Toggle */}
        <div className="md:hidden">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-menu-toggle">
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-6 mt-8 font-mono uppercase">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-lg font-bold text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border">
                  {isAuthenticated ? (
                    <MobileProfileBlock
                      onAction={() => setIsMenuOpen(false)}
                      onLoggedOut={handleLogout}
                    />
                  ) : (
                    <>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full justify-start font-bold rounded-none border-2"
                      >
                        <Link
                          href="/authentication"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <ChevronRight className="size-4 mr-2" />
                          Login
                        </Link>
                      </Button>

                      <Button
                        asChild
                        className="w-full justify-start font-bold rounded-none bg-foreground text-background hover:bg-foreground/90"
                      >
                        <Link
                          href="/authentication?mode=signup"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <ChevronRight className="size-4 mr-2" />
                          Sign Up
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("user");
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {
        // ignore malformed cache
      }
    }

    const token = localStorage.getItem("access_token");
    if (!token) return;

    getMe(token)
      .then((fresh) => {
        setUser(fresh);
        localStorage.setItem("user", JSON.stringify(fresh));
      })
      .catch((err) => console.error(err));
  }, []);

  return user;
}

function initialsOf(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ProfileMenu({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [open, setOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<"logout" | "logout-all" | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const user = useCurrentUser();

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = async () => {
    setActionLoading("logout");
    try {
      await onLoggedOut();
    } finally {
      setActionLoading(null);
      setOpen(false);
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
      setActionLoading(null);
      setOpen(false);
      window.location.href = "/";
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 normal-case tracking-normal font-medium hover:opacity-80 transition-opacity"
      >
        {user?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt={user.full_name}
            className="size-8 rounded-full object-cover ring-1 ring-black/10"
          />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
            {initialsOf(user?.full_name)}
          </div>
        )}
        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5 normal-case tracking-normal">
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="size-11 rounded-full object-cover ring-1 ring-black/10"
              />
            ) : (
              <div className="flex size-11 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {initialsOf(user?.full_name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-serif text-base text-slate-900">
                {user?.full_name ?? "…"}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                <Mail className="size-3 shrink-0" />
                {user?.email ?? ""}
              </p>
            </div>
          </div>

          {user && (
            <div className="mt-3">
              {user.email_verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                  <ShieldCheck className="size-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                  <ShieldAlert className="size-3" />
                  Unverified
                </span>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3">
            <button
              onClick={handleLogout}
              disabled={actionLoading !== null}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition"
            >
              <LogOut className="size-3.5" />
              {actionLoading === "logout" ? "Logging out…" : "Log out"}
            </button>
            <button
              onClick={handleLogoutAll}
              disabled={actionLoading !== null}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 transition"
            >
              <Monitor className="size-3.5" />
              {actionLoading === "logout-all" ? "Logging out…" : "Log out of all devices"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileProfileBlock({
  onAction,
  onLoggedOut,
}: {
  onAction: () => void;
  onLoggedOut: () => void;
}) {
  const user = useCurrentUser();

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-3">
        {user?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt={user.full_name}
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {initialsOf(user?.full_name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-serif text-sm text-foreground">{user?.full_name ?? "…"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
        </div>
      </div>

      <Button
        variant="destructive"
        className="w-full justify-start mt-4"
        onClick={() => {
          onAction();
          onLoggedOut();
        }}
      >
        Logout
      </Button>
    </div>
  );
}