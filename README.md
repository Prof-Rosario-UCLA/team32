# Bruin Hot Take
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?logo=google-cloud&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![MIT License](https://img.shields.io/badge/License-MIT-yellow)
## Running the app in dev mode
**Get a Postgres URL**
Download PostgresSQL on your machine and create a local database
```sql
CREATE DATABASE bruinhottake_dev;
```
Now go back to this app's directory and run:
```
cd backend
npx prisma generate
npx prisma migrate dev
```

**Start Redis**
Download Redis on your machine and start a local instance on your machine
Example Windows Command:
```
redis-server --daemonize yes
```

**SMTP Configuration**
Read into how to get an Application registered here: https://www.gmass.co/blog/gmail-smtp/

**Configure `.env` in `/backend`**
 Create an `.env` file in the `backend` directory and replace `DATABASE_URL`, `SMTP` variables and `R2` variables as needed.
```
NODE_ENV=development
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/bruinhottake_dev?schema=public"
JWT_SECRET="your_secret"
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret
R2_ACCOUNT_ID=your_account_id
R2_BUCKET_NAME=bruinhottake-assets
R2_PUBLIC_DEV_URL=your_endpoint
R2_TOKEN=your_token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=yourpassword
SMTP_USER=your_email@gmail.com
```
**Configure `.env.local` in `/frontend`**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NODE_ENV=development
```
Run `npm run dev` in the root directory. This will start both frontend and backend.

## Deployment
**Step 1: Set up Google Kubernetes Engine (GKE)**
```
# Login to Google Cloud
gcloud auth login

# Set project ID
gcloud config set project cs144-25s-brandonle

# Create GKE cluster
gcloud container clusters create bruinhottake-cluster \
  --num-nodes=3 \
  --zone=us-central1-a \
  --machine-type=e2-standard-2
```

**Step 2: Create Kubernetes Namespace**
```
kubectl create namespace ucla-forum
```

**Step 3: Create Kubernete Secrets for the App**
```
# Create secret for Postegres
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD="your_postgres_password" \
  -n ucla-forum

# Create secrets for backend
kubectl create secret generic backend-secrets \
  --from-literal=database-url="postgresql://postgres:your_password@postgres:5432/bruinhottake_dev?schema=public" \
  --from-literal=jwt-secret="your_jwt_secret" \
  --from-literal=smtp-host="smtp.gmail.com" \
  --from-literal=smtp-port="587" \
  --from-literal=smtp-secure="false" \
  --from-literal=smtp-user="your_email@gmail.com" \
  --from-literal=smtp-pass="your_smtp_password" \
  -n ucla-forum

# Create R2 storage secrets
kubectl create secret generic r2-storage-secrets \
  --from-literal=r2-access-key-id="your_access_key" \
  --from-literal=r2-secret-access-key="your_secret_key" \
  --from-literal=r2-account-id="your_account_id" \
  --from-literal=r2-bucket-name="bruinhottake-assets" \
  --from-literal=r2-public-dev-url="https://your-r2-domain.r2.dev" \
  --from-literal=r2-token="your_token" \
  -n ucla-forum
```
**Step 4: Reserve a Static IP**
```
# Create static IP for your application
gcloud compute addresses create bruinhottake-ip --global

# Get the IP address to use in your DNS configuration
gcloud compute addresses describe bruinhottake-ip --global
```
**Step 5: Configure DNS (Optional)**
If you have a domain name, you can an an A record in your DNS provider and point your domain or subdomain to your static IP address.

**Step 6: Build and Push Docker Images**
This step is typically done if you're not gonna use Github Actions. Do as you free! Don't change the name of :latest to some version numbers... it can get inconsistent quick. 
```
# Configure Docker to use Google Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build and push Backend image
cd backend
docker build -t us-central1-docker.pkg.dev/cs144-25s-brandonle/bruinhottake/backend:latest .
docker push us-central1-docker.pkg.dev/cs144-25s-brandonle/bruinhottake/backend:latest

# Build and push Frontend image
cd ../frontend
docker build -t us-central1-docker.pkg.dev/cs144-25s-brandonle/bruinhottake/frontend:latest .
docker push us-central1-docker.pkg.dev/cs144-25s-brandonle/bruinhottake/frontend:latest
```

**Step 7: Apply `yaml` files**
```
# Create Postgres deployment, service, and PVC
kubectl apply -f k8s/postgres.yaml

# Create Redis deployment and service
kubectl apply -f k8s/redis.yaml

# Create SSL certificate resource
kubectl apply -f k8s/certificate.yaml

# Create backend deployment and service
kubectl apply -f k8s/backend.yaml

# Create frontend deployment and service
kubectl apply -f k8s/frontend.yaml

# Create ingress with routing rules
kubectl apply -f k8s/ingress.yaml
```
## Deployment: Setting up CI/CD
Refer to `google.yml` in `.github\workflows` and add a `GCP_SA_KEY` with your Google Cloud Service account JSON key. You can do this with the following command:
```
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer"

# 2. Grant necessary permissions to the service account
# Grant container admin role (to manage GKE)
gcloud projects add-iam-policy-binding cs144-25s-brandonle \
  --member="serviceAccount:github-actions-deployer@cs144-25s-brandonle.iam.gserviceaccount.com" \
  --role="roles/container.admin"

# Grant storage admin role (to push images)
gcloud projects add-iam-policy-binding cs144-25s-brandonle \
  --member="serviceAccount:github-actions-deployer@cs144-25s-brandonle.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Grant artifact registry admin (to manage images)
gcloud projects add-iam-policy-binding cs144-25s-brandonle \
  --member="serviceAccount:github-actions-deployer@cs144-25s-brandonle.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

# 3. Create and download the JSON key
gcloud iam service-accounts keys create ./gcp-key.json \
  --iam-account=github-actions-deployer@cs144-25s-brandonle.iam.gserviceaccount.com
```
**Useful Debugging Commands**
Use these commands to debug as you feel.  
```
# Check pod logs
kubectl logs <pod-name> -n ucla-forum

# Check pod description for events
kubectl describe pod <pod-name> -n ucla-forum

# Check backend health
curl https://bruinhottake.brandonle.dev/api/health
```

## API Documentation:

### Authentication Endpoints:
`POST /api/auth/login`
- Description: Authenticate user and get JWT token
- Body: { email: string, password: string }
- Response: { token: string, user: { id: number, email: string, role: string } }
- Files: backend/routes/auth.js, frontend/src/lib/auth.ts

`POST /api/auth/signup`
- Description: Create new user account
- Body: { email: string, password: string }
- Response: { token: string, user: { id: number, email: string, role: string } }
- Files: backend/routes/auth.js, frontend/src/lib/auth.ts

`GET /api/auth/me`
- Description: Get current user info
- Headers: Authorization: Bearer <token>
- Response: { id: number, email: string, role: string }
- Files: backend/routes/auth.js, frontend/src/lib/auth.ts

### Posts Endpoints:
`GET /api/posts`
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

`POST /api/posts`
- Description: Create new post
- Headers: Authorization: Bearer <token>
- Body: { title: string, content: string, tags: string[], mediaUrl?: string }
- Response: { id: string, title: string, content: string, ... }
- Files: backend/routes/posts.js, frontend/src/components/post-form.tsx

`POST /api/posts/with-upload`
- Description: Create post with media upload
- Headers: Authorization: Bearer <token>, Content-Type: multipart/form-data
- Body: { title: string, content: string, tags: string[], file: File }
- Response: { id: string, title: string, content: string, mediaUrl: string, ... }
- Files: backend/routes/posts.js, frontend/src/components/post-form.tsx

`POST /api/posts/:id/like`
- Description: Toggle like on a post
- Headers: Authorization: Bearer <token>
- Response: { id: string, liked: boolean, likesCount: number, ... }
- Files: backend/routes/posts.js, frontend/src/components/post-carousel.tsx

`GET /api/posts/:id/comments`
- Description: Get comments for a post
- Response: Comment[]
- Files: backend/routes/posts.js, frontend/src/components/comments-list.tsx

`POST /api/posts/:id/comments`
- Description: Add comment to a post
- Headers: Authorization: Bearer <token>
- Body: { content: string }
- Response: { id: string, content: string, author: { id: number, anonymousName: string }, ... }
- Files: backend/routes/posts.js, frontend/src/components/comment-dialog.tsx

`GET /api/posts/tags`
- Description: Get all unique tags
- Response: string[]
- Files: backend/routes/posts.js, frontend/src/components/post-carousel.tsx

### Trending Endpoints:
`GET /api/trending`
- Description: Get trending posts
- Query Parameters:
  - limit: number (default: 5)
  - timeWindow: 'hour' | 'day' | 'week' (default: 'day')
- Response: { id: string, title: string, heat: number, ... }[]
- Files: backend/routes/trending.js, frontend/src/components/post-carousel.tsx

### Media Endpoints:
`POST /api/posts/media`
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
