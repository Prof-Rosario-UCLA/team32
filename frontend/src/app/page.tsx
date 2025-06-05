'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { NavBar } from "@/components/nav-bar";
import { PostCarousel } from "@/components/post-carousel";
import { useState } from "react";
import { AuthModals } from "@/components/auth-modals";

export default function Home() {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto flex h-[calc(100vh-4rem)] flex-col px-4">
        <div className="flex flex-1 items-center">
          {loading ? (
            <div className="w-full animate-pulse space-y-4">
              <div className="h-8 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
            </div>
          ) : user ? (
            <div className="w-full max-w-2xl mx-auto">
              <PostCarousel />
            </div>
          ) : (
            <div className="grid w-full gap-8 md:grid-cols-2">
              {/* Left Column - Hero */}
              <div className="flex flex-col justify-center space-y-6">
                <div>
                  <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    Share Your{" "}
                    <span className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
                      Hot Takes
                    </span>
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Join the conversation with fellow Bruins. Share your thoughts on campus life, academics, and more.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button size="lg" onClick={() => setShowSignup(true)}>
                    Join Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Right Column - Feature Cards + Preview */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-md space-y-4">
                  <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="text-lg font-semibold">Real-time Updates</h3>
                    <p className="text-sm text-muted-foreground">
                      Stay connected with the latest campus discussions and trending topics.
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="text-lg font-semibold">Engage & Connect</h3>
                    <p className="text-sm text-muted-foreground">
                      Like, comment, and interact with posts from your fellow Bruins.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <AuthModals
        isLoginOpen={showLogin}
        isSignupOpen={showSignup}
        onLoginClose={() => {setShowLogin(false)}}
        onSignupClose={() => setShowSignup(false)}
        onSignupOpen={() => setShowSignup(true)}
        onLoginOpen={() => {setShowLogin(true)}}
      />
    </div>
  );
}
