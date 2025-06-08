import express from 'express';
import prisma from '../prisma/client.js';
import { verifyToken } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

// List of animals for anonymous names
const ANIMALS = [
  'Anonymous Panda', 'Anonymous Fox', 'Anonymous Dolphin', 'Anonymous Eagle',
  'Anonymous Tiger', 'Anonymous Wolf', 'Anonymous Bear', 'Anonymous Lion',
  'Anonymous Owl', 'Anonymous Deer', 'Anonymous Rabbit', 'Anonymous Cat',
  'Anonymous Dog', 'Anonymous Horse', 'Anonymous Elephant', 'Anonymous Giraffe',
  'Anonymous Penguin', 'Anonymous Koala', 'Anonymous Kangaroo', 'Anonymous Zebra'
];


const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Function to get consistent anonymous name for a user
function getAnonymousName(userId) {
  // Use the user's ID to consistently assign the same animal
  const index = userId % ANIMALS.length;
  return ANIMALS[index];
}

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
router.post('/', verifyToken, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const authorId = req.user.id;

    // Parse tags (it comes as a JSON string from FormData)
    const parsedTags = JSON.parse(tags || '[]');

    // Validate required fields
    if (!title || !content || !parsedTags || !Array.isArray(parsedTags)) {
      return res.status(400).json({ 
        message: 'Missing required fields or invalid format' 
      });
    }

    // Handle file uploads
    let imageUrl = null;
    let audioUrl = null;

    if (req.files?.image?.[0]) {
      // Handle image upload (save to storage/cloud)
      const imageFile = req.files.image[0];
      // TODO: Save image and get URL
    }

    if (req.files?.audio?.[0]) {
      // Handle audio upload (save to storage/cloud)
      const audioFile = req.files.audio[0];
      // TODO: Save audio and get URL
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        tags: parsedTags,
        imageUrl,
        audioUrl, // Add this field to your schema if needed
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

// Get comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    
    const comments = await prisma.comment.findMany({
      where: {
        postId: id
      },
      include: {
        author: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform comments to include anonymous names
    const transformedComments = comments.map(comment => ({
      ...comment,
      author: {
        id: comment.author.id,
        anonymousName: getAnonymousName(comment.author.id)
      }
    }));

    res.json(transformedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

// Add a comment to a post
router.post('/:id/comments', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const authorId = req.user.id;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId,
        postId: id
      },
      include: {
        author: {
          select: {
            id: true
          }
        }
      }
    });

    // Update post's comment count
    await prisma.post.update({
      where: { id },
      data: {
        commentsCount: {
          increment: 1
        }
      }
    });

    // Transform the response to include anonymous name
    const transformedComment = {
      ...comment,
      author: {
        id: comment.author.id,
        anonymousName: getAnonymousName(comment.author.id)
      }
    };

    res.status(201).json(transformedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error creating comment' });
  }
});

export default router; 