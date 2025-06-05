'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/contexts/auth-context";
import { Flame, Plus } from "lucide-react";
import { AuthModals } from "@/components/auth-modals";
import { CreatePostModal } from "@/components/create-post-modal";

export function NavBar() {
  const { user, loading } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Bruin Hot Take</span>
          </div>

          {/* Right side items */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsCreatePostOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
                <UserAvatar user={user} />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setIsLoginOpen(true)}>
                  Sign In
                </Button>
                <Button onClick={() => setIsSignupOpen(true)}>
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModals
        isLoginOpen={isLoginOpen}
        isSignupOpen={isSignupOpen}
        onLoginClose={() => setIsLoginOpen(false)}
        onSignupClose={() => setIsSignupOpen(false)}
        onSignupOpen={() => setIsSignupOpen(true)}
        onLoginOpen={() => setIsLoginOpen(true)}
      />

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
      />
    </>
  );
}
