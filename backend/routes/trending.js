import { Router } from 'express';
import prisma from '../prisma/client.js';
import { z } from 'zod';
import { client } from '../redis/client.js';

const router = Router();

// Export constants for heat score calculation
export const LIKE_WEIGHT = 2;
export const COMMENT_WEIGHT = 1;
export const RECENCY_DECAY = 0.1; // Heat decays by 10% per hour
export const NEW_POST_BOOST = 1.2; // New posts get a 20% boost
const CACHE_TTL = 300; // Cache for 5 minutes

const trendingQuerySchema = z.object({
  limit: z.number().min(1).max(20).default(5),
  timeWindow: z.enum(['hour', 'day', 'week']).default('day'),
});

// Helper function to generate cache key
function generateTrendingCacheKey(limit, timeWindow) {
  return `trending:${timeWindow}:${limit}`;
}

// Helper function to invalidate trending caches
export async function invalidateTrendingCaches() {
  const keys = await client.keys('trending:*');
  if (keys.length > 0) {
    await client.del(keys);
  }
}

router.get('/trending', async (req, res) => {
  try {
    const { limit, timeWindow } = trendingQuerySchema.parse({
      limit: Number(req.query.limit) || 5,
      timeWindow: req.query.timeWindow || 'day',
    });

    // Try to get from cache first
    const cacheKey = generateTrendingCacheKey(limit, timeWindow);
    const cachedTrending = await client.get(cacheKey);
    if (cachedTrending) {
      console.log("Trending topics fetched from cache");
      return res.json(JSON.parse(cachedTrending));
    }

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
          (Math.log10(hoursSinceCreation + 2))
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

    // Cache the result
    await client.set(cacheKey, JSON.stringify(trendingPosts), 'EX', CACHE_TTL);

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