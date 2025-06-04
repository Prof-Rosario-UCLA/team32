import express from 'express';
import prisma from '../prisma/client.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get posts with pagination, filtering, and search
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      tags,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      isPublished: true,
      ...(tags && {
        tags: {
          hasSome: Array.isArray(tags) ? tags : [tags]
        }
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Validate sortBy field
    const validSortFields = ['createdAt', 'likesCount', 'commentsCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Get posts with author info and like status for authenticated users
    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            email: true
          }
        },
        likes: req.user ? {
          where: {
            userId: req.user.id
          },
          select: {
            id: true
          }
        } : false
      },
      orderBy: {
        [sortField]: order.toLowerCase()
      },
      skip,
      take
    });

    // Get total count for pagination
    const total = await prisma.post.count({ where });

    // Transform posts to include liked status
    const transformedPosts = posts.map(post => ({
      ...post,
      liked: post.likes?.length > 0,
      likes: undefined // Remove the likes array from response
    }));

    res.json({
      posts: transformedPosts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// Create a new post
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, content, tags, imageUrl } = req.body;
    const authorId = req.user.id;

    // Validate required fields
    if (!title || !content || !tags || !Array.isArray(tags)) {
      return res.status(400).json({ 
        message: 'Missing required fields or invalid format' 
      });
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        tags,
        imageUrl: imageUrl || null,
        authorId,
        isPublished: true,
        likesCount: 0,
        commentsCount: 0
      },
      include: {
        author: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({ ...post, liked: false });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ 
      message: error.message || 'Error creating post' 
    });
  }
});

// Toggle like on a post
router.post('/:id/like', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: id
        }
      }
    });

    if (existingLike) {
      // Unlike the post
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId: id
          }
        }
      });

      const post = await prisma.post.update({
        where: { id },
        data: {
          likesCount: {
            decrement: 1
          }
        },
        include: {
          author: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });

      return res.json({ ...post, liked: false });
    } else {
      // Like the post
      await prisma.like.create({
        data: {
          userId,
          postId: id
        }
      });

      const post = await prisma.post.update({
        where: { id },
        data: {
          likesCount: {
            increment: 1
          }
        },
        include: {
          author: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });

      return res.json({ ...post, liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Error toggling like' });
  }
});

// Get all unique tags
router.get('/tags', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      select: {
        tags: true
      },
      where: {
        isPublished: true
      }
    });

    const allTags = posts.flatMap(post => post.tags);
    const uniqueTags = [...new Set(allTags)];

    res.json(uniqueTags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Error fetching tags' });
  }
});

export default router; 