'use client';

import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 px-4">
        <WifiOff className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">You&#39;re Offline</h1>
        <p className="text-lg mb-4">You&#39;re offline. Please check your internet connection.</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    </div>
  );
} 