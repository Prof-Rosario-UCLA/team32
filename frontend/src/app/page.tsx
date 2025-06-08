'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { NavBar } from "@/components/nav-bar";
import { PostCarousel } from "@/components/post-carousel";
import { useState, useEffect } from "react";
import { AuthModals } from "@/components/auth-modals";
import { motion } from "framer-motion";

interface TrendingTopic {
  id: string;
  title: string;
  heat: number;
  likes: number;
  comments: number;
  createdAt: string;
}

export default function Home() {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/trending?limit=3&timeWindow=day');
        if (!response.ok) throw new Error('Failed to fetch trending topics');
        const data = await response.json();
        setTrendingTopics(data);
      } catch (error) {
        console.error('Error fetching trending topics:', error);
      } finally {
        setTrendingLoading(false);
      }
    };

    fetchTrendingTopics();
    // Refresh trending topics every 5 minutes
    const interval = setInterval(fetchTrendingTopics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
                <div className="relative">
                  <motion.div
                    className="absolute -left-4 -top-4 text-orange-500"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [-5, 5, -5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Flame className="h-8 w-8" />
                  </motion.div>
                  <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    Share Your{" "}
                    <span className="relative bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
                      Hot Takes
                      <motion.span
                        className="absolute -right-6 top-0 text-orange-500"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        🔥
                      </motion.span>
                    </span>
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Join the conversation with fellow Bruins. Share your thoughts on campus life, academics, and more.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    onClick={() => setShowSignup(true)}
                    className="group relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    <span className="relative z-10 flex items-center">
                      Join Now <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "0%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </Button>
                </div>

                {/* Trending Topics Section */}
                <div className="mt-8 space-y-4">
                  <h3 className="flex items-center text-xl font-semibold">
                    <TrendingUp className="mr-2 h-5 w-5 text-orange-500" />
                    Trending Hot Takes
                  </h3>
                  <div className="space-y-3">
                    {trendingLoading ? (
                      // Loading skeleton
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="h-16 rounded-lg border bg-muted" />
                        </div>
                      ))
                    ) : trendingTopics.length > 0 ? (
                      trendingTopics.map((topic) => (
                        <motion.div
                          key={topic.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-shadow hover:shadow-md"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{topic.title}</p>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${topic.heat}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                              />
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{topic.likes} likes</span>
                              <span>•</span>
                              <span>{topic.comments} comments</span>
                            </div>
                          </div>
                          <span className="flex items-center text-sm font-medium text-orange-500">
                            {topic.heat}° <Zap className="ml-1 h-4 w-4" />
                          </span>
                        </motion.div>
                      ))
                    ) : (
                      <div className="rounded-lg border bg-card p-4 text-center text-muted-foreground">
                        No trending topics yet. Be the first to share your hot take!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Feature Cards + Preview */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-md space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-2 flex items-center">
                      <Flame className="mr-2 h-5 w-5 text-orange-500" />
                      <h3 className="text-lg font-semibold">Real-time Updates</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Stay connected with the latest campus discussions and trending topics.
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-2 flex items-center">
                      <Zap className="mr-2 h-5 w-5 text-orange-500" />
                      <h3 className="text-lg font-semibold">Engage & Connect</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Like, comment, and interact with posts from your fellow Bruins.
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <AuthModals
        isLoginOpen={showLogin}
        isSignupOpen={showSignup}
        onLoginClose={() => { setShowLogin(false) }}
        onSignupClose={() => setShowSignup(false)}
        onSignupOpen={() => setShowSignup(true)}
        onLoginOpen={() => { setShowLogin(true) }}
      />
    </div>
  );
}
