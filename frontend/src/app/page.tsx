'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MessageSquare, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { PreviewCard } from "@/components/preview-card";
import { NavBar } from "@/components/nav-bar";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If authenticated, redirect to home page
  if (user) {
    router.push('/home');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto flex h-[calc(100vh-4rem)] flex-col px-4">
        {/* Main Content */}
        <div className="flex flex-1 items-center">
          {loading ? (
            <div className="w-full animate-pulse space-y-4">
              <div className="h-8 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
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
                  <Button asChild size="lg">
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
                  <Card className="bg-card/50 backdrop-blur">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <MessageSquare className="mb-3 h-8 w-8 text-primary" />
                      <h3 className="mb-2 font-semibold">Share Your Hot Takes</h3>
                      <p className="text-sm text-muted-foreground">Express your opinions completely unfiltered</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <TrendingUp className="mb-3 h-8 w-8 text-primary" />
                      <h3 className="mb-2 font-semibold">Stay Updated</h3>
                      <p className="text-sm text-muted-foreground">Real-time discussions</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <Users className="mb-3 h-8 w-8 text-primary" />
                      <h3 className="mb-2 font-semibold">Connect</h3>
                      <p className="text-sm text-muted-foreground">Join the UCLA community</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-lg font-bold text-primary">@</span>
                      </div>
                      <h3 className="mb-2 font-semibold">UCLA Only</h3>
                      <p className="text-sm text-muted-foreground">Exclusive to Bruins</p>
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
      </main>
    </div>
  );
}
