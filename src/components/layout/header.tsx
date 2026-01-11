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
];

export function Header() {
  const pathname = usePathname();

  const renderNavLinks = (isMobile = false, closeSheet?: () => void) =>
    navLinks.map((link) => (
      <Button
        key={link.href}
        asChild
        variant="link"
        className={cn(
          "text-neutral-400 hover:text-white transition-colors duration-200 text-sm font-medium",
          pathname === link.href && "text-white font-semibold",
          isMobile && "w-full justify-start text-lg py-6"
        )}
        onClick={closeSheet}
      >
        <Link href={link.href}>{link.label}</Link>
      </Button>
    ));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-neutral-950/50 backdrop-blur-md">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
              E
          </div>
          <span className="font-bold text-lg tracking-tight text-white">E-Voting DAGM</span>
        </Link>
        <div className="hidden md:flex flex-1 items-center space-x-2">
           <Link href="/leaderboard" className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Hasil Suara</Link>
           <Link href="/#cara-voting" className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Cara Voting</Link>
           <Link href="/#faq" className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">FAQ</Link>
        </div>
        <div className="flex flex-1 items-center justify-end md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Buka Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-neutral-950/90 backdrop-blur-xl border-l-white/10">
              <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
              <nav className="flex flex-col space-y-4 mt-12">
                {renderNavLinks(true)}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
         <div className="hidden md:flex items-center gap-2 text-white bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Live Voting
        </div>
      </div>
    </header>
  );
}
