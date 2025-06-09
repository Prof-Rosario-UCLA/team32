# Bruin Hot Take

## Starting the app
Run `npm run dev` in the root directory. This will start both frontend and backend.

## API Documentation:

### Authentication Endpoints:
POST /api/auth/login
- Description: Authenticate user and get JWT token
- Body: { email: string, password: string }
- Response: { token: string, user: { id: number, email: string, role: string } }
- Files: backend/routes/auth.js, frontend/src/lib/auth.ts

POST /api/auth/signup
- Description: Create new user account
- Body: { email: string, password: string }
- Response: { token: string, user: { id: number, email: string, role: string } }
- Files: backend/routes/auth.js, frontend/src/lib/auth.ts

GET /api/auth/me
- Description: Get current user info
- Headers: Authorization: Bearer <token>
- Response: { id: number, email: string, role: string }
- Files: backend/routes/auth.js, frontend/src/lib/auth.ts

### Posts Endpoints:
GET /api/posts
- Description: Get paginated posts with filtering and sorting
- Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 10)
  - tags: string[] (comma-separated)
  - search: string
  - sortBy: 'createdAt' | 'likesCount' | 'commentsCount' | 'heat'
  - order: 'asc' | 'desc'
- Response: { posts: Post[], pagination: { total, page, limit, totalPages } }
- Files: backend/routes/posts.js, frontend/src/components/post-carousel.tsx

POST /api/posts
- Description: Create new post
- Headers: Authorization: Bearer <token>
- Body: { title: string, content: string, tags: string[], mediaUrl?: string }
- Response: { id: string, title: string, content: string, ... }
- Files: backend/routes/posts.js, frontend/src/components/post-form.tsx

POST /api/posts/with-upload
- Description: Create post with media upload
- Headers: Authorization: Bearer <token>, Content-Type: multipart/form-data
- Body: { title: string, content: string, tags: string[], file: File }
- Response: { id: string, title: string, content: string, mediaUrl: string, ... }
- Files: backend/routes/posts.js, frontend/src/components/post-form.tsx

POST /api/posts/:id/like
- Description: Toggle like on a post
- Headers: Authorization: Bearer <token>
- Response: { id: string, liked: boolean, likesCount: number, ... }
- Files: backend/routes/posts.js, frontend/src/components/post-carousel.tsx

GET /api/posts/:id/comments
- Description: Get comments for a post
- Response: Comment[]
- Files: backend/routes/posts.js, frontend/src/components/comments-list.tsx

POST /api/posts/:id/comments
- Description: Add comment to a post
- Headers: Authorization: Bearer <token>
- Body: { content: string }
- Response: { id: string, content: string, author: { id: number, anonymousName: string }, ... }
- Files: backend/routes/posts.js, frontend/src/components/comment-dialog.tsx

GET /api/posts/tags
- Description: Get all unique tags
- Response: string[]
- Files: backend/routes/posts.js, frontend/src/components/post-carousel.tsx

### Trending Endpoints:
GET /api/trending
- Description: Get trending posts
- Query Parameters:
  - limit: number (default: 5)
  - timeWindow: 'hour' | 'day' | 'week' (default: 'day')
- Response: { id: string, title: string, heat: number, ... }[]
- Files: backend/routes/trending.js, frontend/src/components/post-carousel.tsx

### Media Endpoints:
POST /api/posts/media
- Description: Upload media file
- Headers: Authorization: Bearer <token>, Content-Type: multipart/form-data
- Body: { file: File }
- Response: { url: string, fileName: string, size: number, type: string }
- Files: backend/routes/posts.js, frontend/src/lib/media-utils.ts

### WebSocket Events:
- 'new-post': Emitted when a new post is created
- 'post-updated': Emitted when a post is updated (likes, comments)
- 'post-deleted': Emitted when a post is deleted
- 'recent-messages': Emitted on connection with recent posts
- Files: backend/websocket/client.js, frontend/src/lib/socket.ts

### Error Responses:
- 400: Bad Request - Invalid input data
- 401: Unauthorized - Missing or invalid token
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource doesn't exist
- 500: Internal Server Error - Server-side error

All endpoints except /api/auth/login and /api/auth/signup require authentication via JWT token in the Authorization header. Cookie will not be set until user accepts on the banner
Rate limiting is applied to all endpoints to prevent abuse.