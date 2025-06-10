'use client';

import { Button } from "../components/ui/button";
import { ArrowRight, Flame, Zap } from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { NavBar } from "../components/nav/nav-bar";
import { PostCarousel } from "../components/posts/post-carousel";
import { useState } from "react";
import { AuthModals } from "../components/modals/auth-modals";
import { motion } from "framer-motion";
import { TrendingTopics } from "../components/posts/trending-topics";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    dragFree: true,
    containScroll: "trimSnaps",
    align: "start"
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-orange-950/5">
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
              {/* hero */}
              <div className="flex flex-col justify-center items-center text-center space-y-6 pt-8 md:pt-0 md:items-start md:text-left">
                <div className="relative w-full md:max-w-lg lg:max-w-xl">
                  <motion.div
                    className="absolute left-9 -top-4 sm:-left-4 md:-top-4"
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
                    <Flame className="h-8 w-8 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                  </motion.div>
                  <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    Share Your{" "}
                    <span className="relative inline-block">
                      <span className="relative z-10 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
                        Hot Takes
                      </span>
                      <motion.span
                        className="absolute -right-6 top-0 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                        animate={{
                          opacity: [0.5, 1, 0.5],
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        🔥
                      </motion.span>
                      <motion.div
                        className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 blur-xl"
                        animate={{
                          opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </span>
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Join the conversation with fellow Bruins. Share your thoughts on campus life, academics, and more.
                  </p>
                </div>
                <div className="flex gap-4 md:justify-start justify-center">
                  <Button
                    size="lg"
                    onClick={() => setShowSignup(true)}
                    className="group relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300"
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

                {/* mobile carousel */}
                <div className="md:hidden relative px-4 w-full">
                  <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex">
                      {/* topics slide */}
                      <div className="flex-[0_0_100%] min-w-0 pb-8">
                        <div className="backdrop-blur-sm rounded-lg p-4">
                          <TrendingTopics />
                        </div>
                      </div>
                      {/* feature cards slide */}
                      <div className="flex-[0_0_100%] min-w-0 flex items-center justify-center">
                        <div className="space-y-4 mt-0 backdrop-blur-sm rounded-lg p-4">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="rounded-lg border backdrop-blur-sm p-6 shadow-lg shadow-orange-500/5 hover:shadow-orange-500/10 transition-all duration-300"
                          >
                            <div className="mb-2 flex items-center">
                              <Flame className="mr-2 h-5 w-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]" />
                              <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Real-time Updates</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Stay connected with the latest campus discussions and trending topics.
                            </p>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="rounded-lg border backdrop-blur-sm p-6 shadow-lg shadow-orange-500/5 hover:shadow-orange-500/10 transition-all duration-300"
                          >
                            <div className="mb-2 flex items-center">
                              <Zap className="mr-2 h-5 w-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]" />
                              <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Engage & Connect</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Like, comment, and interact with posts from your fellow Bruins.
                            </p>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* nav buttons */}
                  <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => emblaApi?.scrollPrev()}
                      className="rounded-full"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => emblaApi?.scrollNext()}
                      className="rounded-full"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* desktop trending topics */}
                <div className="hidden md:block w-full" >
                  <TrendingTopics />
                </div>
              </div>

              {/* feature cards ~ desktop */}
              <div className="hidden md:flex items-center justify-center pt-8 md:pt-0">
                <div className="w-full max-w-md md:max-w-lg space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="rounded-lg border bg-card/50 backdrop-blur-sm p-6 shadow-lg shadow-orange-500/5 hover:shadow-orange-500/10 transition-all duration-300"
                  >
                    <div className="mb-2 flex items-center">
                      <Flame className="mr-2 h-5 w-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]" />
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Real-time Updates</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Stay in the loop on campus discussions and trending topics.
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="rounded-lg border bg-card/50 backdrop-blur-sm p-6 shadow-lg shadow-orange-500/5 hover:shadow-orange-500/10 transition-all duration-300"
                  >
                    <div className="mb-2 flex items-center">
                      <Zap className="mr-2 h-5 w-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]" />
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Engage & Connect</h3>
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
