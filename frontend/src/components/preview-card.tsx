'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const previewPosts = [
  {
    id: 1,
    content: "The dining halls need to bring back the midnight breakfast tradition! 🍳",
    author: "Anonymous Bruin",
  },
  {
    id: 2,
    content: "Powell Library during finals week is a vibe like no other 📚",
    author: "Anonymous Bruin",
  },
  {
    id: 3,
    content: "The best study spot on campus is definitely the top floor of YRL 🌟",
    author: "Anonymous Bruin",
  },
  {
    id: 4,
    content: "Nothing beats a sunset at Janss Steps 🌅",
    author: "Anonymous Bruin",
  },
];

export function PreviewCard() {
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentPostIndex((prev) => (prev + 1) % previewPosts.length);
        setIsVisible(true);
      }, 500); // Half of the transition time
    }, 3000); // Show each post for 3 seconds

    return () => clearInterval(interval);
  }, []);

  const currentPost = previewPosts[currentPostIndex];

  return (
    <Card className="h-[200px] w-full border-none bg-white/50 backdrop-blur-sm transition-opacity duration-500">
      <CardContent className="flex h-full flex-col justify-center p-6">
        <div
          className={`transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="mb-4 text-lg font-medium text-gray-900">
            {currentPost.content}
          </p>
          <p className="text-sm text-gray-500">- {currentPost.author}</p>
        </div>
      </CardContent>
    </Card>
  );
} 