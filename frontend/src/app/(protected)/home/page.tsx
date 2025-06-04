'use client';

import { NavBar } from "@/components/nav-bar";
import { PostCarousel } from "@/components/post-carousel";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto flex h-[calc(100vh-4rem)] flex-col px-4">
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-2xl mx-auto">
            <PostCarousel />
          </div>
        </div>
      </main>
    </div>
  );
} 