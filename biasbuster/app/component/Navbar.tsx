"use client";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Brain, Menu, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Pricing", href: "#pricing" },
    { label: "Docs", href: "#docs" },
    { label: "Blog", href: "#blog" },
    { label: "Tutorials", href: "#tutorials" },
    { label: "Workspace", href: "/Workspace" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full py-4 md:py-6">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2 group">
            <div className="size-8 flex items-center justify-center text-foreground">
              <Brain className="size-8 stroke-[2.5]" />
            </div>
            <span className="font-display text-xl tracking-wider text-foreground uppercase">
              BiasBuster
            </span>
          </a>
        </Link>

        {/* Center: Floating Nav Pill */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="bg-[#E5E5E5] backdrop-blur-md px-2 py-1.5 rounded-md flex items-center gap-1 shadow-sm border border-white/50">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-1.5 text-[11px] font-jetbrains  text-muted-foreground hover:text-foreground hover:bg-white/60 rounded-sm transition-all uppercase tracking-wide"
                data-testid={`link-nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-6 font-jetbrains text-xs font-bold uppercase tracking-wide">
          <a href="#" className="flex items-center gap-1 hover:text-muted-foreground transition-colors">
            <ChevronRight className="size-3" />
            Login
          </a>
          <Button size="sm" className="h-9 px-5 rounded-sm bg-foreground text-background hover:bg-foreground/90 font-bold tracking-wider">
            <ChevronRight className="size-3 mr-1" />
            Sign Up
          </Button>
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
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-lg font-bold text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border">
                  <Button variant="outline" className="w-full justify-start font-bold rounded-none border-2">
                    <ChevronRight className="size-4 mr-2" />
                    Login
                  </Button>
                  <Button className="w-full justify-start font-bold rounded-none bg-foreground text-background hover:bg-foreground/90">
                    <ChevronRight className="size-4 mr-2" />
                    Sign Up
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
