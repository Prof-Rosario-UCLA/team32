'use client';

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/contexts/auth-context";
import { Flame } from "lucide-react";
import Link from "next/link";

export function NavBar() {
  const { user, loading } = useAuth();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo on the left */}
        <div className="flex items-center gap-2">
          <Link href="/home" className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Bruin Hot Take</span>
          </Link>
        </div>

        {/* Spacer pushes next items to the right */}
        <div className="flex-1" />

        {/* Right side: ThemeToggle + Auth */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <UserAvatar user={user} />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
