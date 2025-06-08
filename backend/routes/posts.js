import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import path from 'path';
import prisma from '../prisma/client.js';
import { verifyToken } from '../middleware/auth.js';
import { client } from '../redis/client.js';

const router = express.Router();

// Configure R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only images and audio files
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp3|wav|m4a|ogg|aac|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and audio files are allowed'));
    }
  }
});

// Generate unique filename
function generateFileName(originalName) {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(6).toString('hex');
  const extension = path.extname(originalName);
  return `posts/${timestamp}-${randomString}${extension}`;
}

// Upload file to R2
async function uploadToR2(file) {
  const fileName = generateFileName(file.originalname);
  
  const uploadCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    Metadata: {
      originalName: file.originalname,
      uploadedAt: new Date().toISOString(),
    }
  });

  await r2Client.send(uploadCommand);
  
  // Return public URL for your bucket
  return `${process.env.R2_PUBLIC_DEV_URL}/${fileName}`;
}

// Cache expiration times (in seconds)
const CACHE_TTL = {
  POSTS: 300, // 5 minutes
  TAGS: 3600, // 1 hour
  COMMENTS: 600, // 10 minutes
};

// List of animals for anonymous names
const ANIMALS = [
  'Anonymous Panda', 'Anonymous Fox', 'Anonymous Dolphin', 'Anonymous Eagle',
  'Anonymous Tiger', 'Anonymous Wolf', 'Anonymous Bear', 'Anonymous Lion',
  'Anonymous Owl', 'Anonymous Deer', 'Anonymous Rabbit', 'Anonymous Cat',
  'Anonymous Dog', 'Anonymous Horse', 'Anonymous Elephant', 'Anonymous Giraffe',
  'Anonymous Penguin', 'Anonymous Koala', 'Anonymous Kangaroo', 'Anonymous Zebra'
];

// Function to get consistent anonymous name for a user
function getAnonymousName(userId) {
  const index = userId % ANIMALS.length;
  return ANIMALS[index];
}

// Helper function to generate cache keys
function generateCacheKey(prefix, params) {
  return `${prefix}:${JSON.stringify(params)}`;
}

// Helper function to invalidate related caches
async function invalidatePostCaches() {
  const keys = await client.keys('posts:*');
  if (keys.length > 0) {
    await client.del(keys);
  }
  await client.del('tags:all');
}

// Upload file endpoint (separate from post creation)
router.post('/media', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = await uploadToR2(req.file);

    res.json({
      success: true,
      url: fileUrl,
      fileName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Upload voice memo as base64
router.post('/upload-voice', verifyToken, async (req, res) => {
  try {
    const { data, filename, contentType } = req.body;
    
    if (!data || !filename) {
      return res.status(400).json({ error: 'Missing data or filename' });
    }

    // Remove data URL prefix if present
    const base64Data = data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const fileName = generateFileName(filename);

    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType || 'audio/webm',
      Metadata: {
        originalName: filename,
        uploadedAt: new Date().toISOString(),
        source: 'voice-memo'
      }
    });

    await r2Client.send(uploadCommand);
    const fileUrl = `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${fileName}`;

    res.json({
      success: true,
      url: fileUrl,
      fileName: filename,
      size: buffer.length
    });

  } catch (error) {
    console.error('Voice upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

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

    // Generate cache key based on query parameters and user ID (for liked status)
    const cacheKey = generateCacheKey('posts', {
      page,
      limit,
      tags,
      search,
      sortBy,
      order,
      userId: req.user?.id || null
    });

    // Try to get from cache first
    const cachedResult = await client.get(cacheKey);
    if (cachedResult) {
      console.log("Posts fetched from cache");
      return res.json(JSON.parse(cachedResult));
    }

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

    const result = {
      posts: transformedPosts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };

    // Cache the result
    await client.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL.POSTS);

    res.json(result);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// Create a new post (now accepts media URLs from previous uploads)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, content, tags, mediaUrl } = req.body;
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
        mediaUrl: mediaUrl || null,
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

    // Invalidate relevant caches
    await invalidatePostCaches();

    res.status(201).json({ ...post, liked: false });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ 
      message: error.message || 'Error creating post' 
    });
  }
});

// Create post with file upload in single request
router.post('/with-upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const authorId = req.user.id;

    // Validate required fields
    if (!title || !content || !tags) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }

    // Parse tags if it's a string
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;

    if (!Array.isArray(parsedTags)) {
      return res.status(400).json({ 
        message: 'Tags must be an array' 
      });
    }

    let mediaUrl = null;
    
    // Upload file if provided
    if (req.file) {
      mediaUrl = await uploadToR2(req.file);
    }

    // Determine if it's image or audio based on file type
    const isImage = req.file?.mimetype.startsWith('image/');
    const isAudio = req.file?.mimetype.startsWith('audio/');

    const post = await prisma.post.create({
      data: {
        title,
        content,
        tags: parsedTags,
        mediaUrl: mediaUrl || null,
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

    // Invalidate relevant caches
    await invalidatePostCaches();

    res.status(201).json({ ...post, liked: false });
  } catch (error) {
    console.error('Error creating post with upload:', error);
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

    let post;
    
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

      post = await prisma.post.update({
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

      post = { ...post, liked: false };
    } else {
      // Like the post
      await prisma.like.create({
        data: {
          userId,
          postId: id
        }
      });

      post = await prisma.post.update({
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

      post = { ...post, liked: true };
    }

    // Invalidate post caches since like count changed
    await invalidatePostCaches();

    res.json(post);
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Error toggling like' });
  }
});

// Get all unique tags
router.get('/tags', async (req, res) => {
  try {
    const cacheKey = 'tags:all';
    
    // Try to get from cache first
    const cachedTags = await client.get(cacheKey);
    if (cachedTags) {
      console.log("Tags fetched from cache");
      return res.json(JSON.parse(cachedTags));
    }

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

    // Cache the tags
    await client.set(cacheKey, JSON.stringify(uniqueTags), 'EX', CACHE_TTL.TAGS);

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
    const cacheKey = `comments:post:${id}`;
    
    // Try to get from cache first
    const cachedComments = await client.get(cacheKey);
    if (cachedComments) {
      console.log("Comments fetched from cache");
      return res.json(JSON.parse(cachedComments));
    }
    
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

    // Cache the comments
    await client.set(cacheKey, JSON.stringify(transformedComments), 'EX', CACHE_TTL.COMMENTS);

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

    // Invalidate relevant caches
    await invalidatePostCaches(); // Invalidate posts cache because comment count changed
    await client.del(`comments:post:${id}`); // Invalidate specific post's comments cache

    res.status(201).json(transformedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error creating comment' });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  res.status(500).json({ error: error.message });
});

export default router;