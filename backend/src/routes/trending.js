import { Router } from 'express';
import prisma from '../../prisma/client.js';
import { z } from 'zod';

const router = Router();

// Heat calculation constants
const LIKE_WEIGHT = 2;
const COMMENT_WEIGHT = 1;
const RECENCY_DECAY = 0.1; // Heat decays by 10% per hour
const NEW_POST_BOOST = 1.2; // New posts get a 20% boost

// Input validation schema
const trendingQuerySchema = z.object({
    limit: z.number().min(1).max(20).default(5),
    timeWindow: z.enum(['hour', 'day', 'week']).default('day'),
});

router.get('/trending', async (req, res) => {
    try {
        // Validate query parameters
        const { limit, timeWindow } = trendingQuerySchema.parse({
            limit: Number(req.query.limit) || 5,
            timeWindow: req.query.timeWindow || 'day',
        });

        // Calculate time window
        const now = new Date();
        const timeWindowHours = {
            hour: 1,
            day: 24,
            week: 168,
        }[timeWindow];
        const timeWindowStart = new Date(now.getTime() - timeWindowHours * 60 * 60 * 1000);

        // Get posts with their engagement metrics
        const posts = await prisma.post.findMany({
            where: {
                isPublished: true,
                createdAt: {
                    gte: timeWindowStart,
                },
            },
            include: {
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate heat score for each post
        const postsWithHeat = posts.map(post => {
            const hoursSinceCreation = (now.getTime() - post.createdAt.getTime()) / (1000 * 60 * 60);
            const hoursSinceLastEngagement = Math.min(
                hoursSinceCreation,
                post.updatedAt ? (now.getTime() - post.updatedAt.getTime()) / (1000 * 60 * 60) : hoursSinceCreation
            );

            // Base heat from engagement
            const engagementHeat =
                (post._count.likes * LIKE_WEIGHT) +
                (post._count.comments * COMMENT_WEIGHT);

            // Apply time decay
            const timeDecay = Math.exp(-RECENCY_DECAY * hoursSinceLastEngagement);

            // Apply new post boost (if post is less than 24 hours old)
            const newPostBoost = hoursSinceCreation < 24 ? NEW_POST_BOOST : 1;

            // Calculate final heat score (0-100)
            const heatScore = Math.min(
                100,
                Math.round(
                    (engagementHeat * timeDecay * newPostBoost) /
                    (Math.log10(hoursSinceCreation + 2)) // Logarithmic scaling to prevent older posts from dominating
                )
            );

            return {
                id: post.id,
                title: post.title,
                heat: heatScore,
                likes: post._count.likes,
                comments: post._count.comments,
                createdAt: post.createdAt,
            };
        });

        // Sort by heat and return top posts
        const trendingPosts = postsWithHeat
            .sort((a, b) => b.heat - a.heat)
            .slice(0, limit);

        res.json(trendingPosts);
    } catch (error) {
        console.error('Error fetching trending posts:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router; 