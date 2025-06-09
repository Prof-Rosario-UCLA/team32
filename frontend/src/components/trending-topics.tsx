'use client';

import { useState, useEffect } from "react";
import { TrendingUp, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { getSocket } from "@/lib/socket";

interface TrendingTopic {
    id: string;
    title: string;
    heat: number;
    likes: number;
    comments: number;
    createdAt: string;
}

export function TrendingTopics() {
    const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
    const [trendingLoading, setTrendingLoading] = useState(true);

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

    useEffect(() => {
        fetchTrendingTopics();

        // Set up socket.io listeners for real-time updates
        const socket = getSocket();

        // Refresh trending topics when:
        // 1. A new post is created
        // 2. A post is liked/unliked
        // 3. A comment is added
        const handlePostUpdate = () => {
            fetchTrendingTopics();
        };

        socket.on('new-post', handlePostUpdate);
        socket.on('post-liked', handlePostUpdate);
        socket.on('post-unliked', handlePostUpdate);
        socket.on('new-comment', handlePostUpdate);

        // Refresh trending topics every 5 minutes
        const interval = setInterval(fetchTrendingTopics, 5 * 60 * 1000);

        return () => {
            clearInterval(interval);
            socket.off('new-post', handlePostUpdate);
            socket.off('post-liked', handlePostUpdate);
            socket.off('post-unliked', handlePostUpdate);
            socket.off('new-comment', handlePostUpdate);
        };
    }, []);

    return (
        <div className="mt-8 space-y-4">
            <h3 className="flex items-center text-xl font-semibold">
                <TrendingUp className="mr-2 h-5 w-5 text-orange-500" />
                Trending Hot Takes
            </h3>
            <div className="space-y-3">
                {trendingLoading ? (
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
                                {topic.heat}° <Flame className="ml-1 h-4 w-4" />
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
    );
} 