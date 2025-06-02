'use client';

import { Showcase } from "@/components/showcase";
import { NavBar } from "@/components/nav-bar";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto flex h-[calc(100vh-4rem)] flex-col px-4">
        <div className="flex flex-1 items-center">
          <div className="w-full">
            <Showcase />
          </div>
        </div>
      </main>
    </div>
  );
} 