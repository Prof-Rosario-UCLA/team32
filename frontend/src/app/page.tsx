'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MessageSquare, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { UserAvatar } from "@/components/user-avatar";
import { PreviewCard } from "@/components/preview-card";
import { Showcase } from "@/components/showcase";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto flex h-full flex-col px-4">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">Bruin Hot Take</span>
          </div>
          <div className="flex gap-4">
            <ThemeToggle />
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            ) : user ? (
              <UserAvatar user={user} />
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 items-center">
          {loading ? (
            <div className="w-full animate-pulse space-y-4">
              <div className="h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ) : user ? (
            <div className="w-full">
              <Showcase />
            </div>
          ) : (
            <div className="grid w-full gap-8 md:grid-cols-2">
              {/* Left Column - Hero */}
              <div className="flex flex-col justify-center space-y-6">
                <div>
                  <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
                    Share Your{" "}
                    <span className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
                      Hot Takes
                    </span>
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Join the conversation with fellow Bruins. Share your thoughts on campus life, academics, and more.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                    <Link href="/signup">
                      Join Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right Column - Feature Cards + Preview */}
              <div className="flex flex-col gap-8">
                {/* 2x2 Feature Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Repeat Card 4 times */}
                  <Card className="border-none bg-white/50 backdrop-blur-sm dark:bg-gray-800/50">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <MessageSquare className="mb-3 h-8 w-8 text-blue-600 dark:text-blue-400" />
                      <h3 className="mb-2 font-semibold">Share Your Hot Takes</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Express your opinions completely unfiltered</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-white/50 backdrop-blur-sm dark:bg-gray-800/50">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <TrendingUp className="mb-3 h-8 w-8 text-blue-600 dark:text-blue-400" />
                      <h3 className="mb-2 font-semibold">Stay Updated</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Real-time discussions</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-white/50 backdrop-blur-sm dark:bg-gray-800/50">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <Users className="mb-3 h-8 w-8 text-blue-600 dark:text-blue-400" />
                      <h3 className="mb-2 font-semibold">Connect</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Join the UCLA community</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-white/50 backdrop-blur-sm dark:bg-gray-800/50">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">@</span>
                      </div>
                      <h3 className="mb-2 font-semibold">UCLA Only</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Exclusive to Bruins</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview Card */}
                <div className="flex items-center justify-center">
                  <PreviewCard />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          © 2025 Bruin Hot Take
        </footer>
      </div>
    </main>
  );
}
