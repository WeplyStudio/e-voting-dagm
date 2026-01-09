"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Vote } from "lucide-react";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/leaderboard", label: "Hasil Suara" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const pathname = usePathname();

  const renderNavLinks = (isMobile = false) =>
    navLinks.map((link) => (
      <Button
        key={link.href}
        asChild
        variant="ghost"
        className={cn(
          "text-muted-foreground hover:text-primary transition-colors duration-200",
          pathname === link.href && "text-primary font-semibold",
          isMobile && "w-full justify-start text-lg py-6"
        )}
      >
        <Link href={link.href}>{link.label}</Link>
      </Button>
    ));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center">
        <Link href="/" className="mr-8 flex items-center gap-2">
          <Vote className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline text-xl">E-Voting OSIS</span>
        </Link>
        <div className="hidden md:flex flex-1 items-center space-x-2">
          {renderNavLinks()}
        </div>
        <div className="flex flex-1 items-center justify-end md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Buka Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
              <nav className="flex flex-col space-y-4 mt-12">
                {renderNavLinks(true)}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
