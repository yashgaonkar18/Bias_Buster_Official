"use client";
import { useEffect, useState } from "react";
import { useRouter,usePathname } from "next/navigation";
import { logout } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brain, Menu, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
}, [pathname]);

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

    setIsAuthenticated(false);

    router.push("/");
  };

  const navItems = [
    { label: "Docs", href: "#docs" },
    { label: "Blog", href: "#blog" },
    { label: "Tutorials", href: "#tutorials" },
    { label: "Workspace", href: "/Workspace" },
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
              <Link
                href="/profile"
                className="hover:text-muted-foreground transition-colors"
              >
                Profile
              </Link>

              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
              >
                Logout
              </Button>
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
                    <>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Link
                          href="/profile"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Profile
                        </Link>
                      </Button>

                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleLogout();
                        }}
                      >
                        Logout
                      </Button>
                    </>
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