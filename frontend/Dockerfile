# Multi-stage build
FROM node:20-slim AS builder

WORKDIR /app

# Update npm to latest version to avoid compatibility issues
RUN npm install -g npm@latest

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
# Use npm install instead of npm ci since package-lock.json might not exist
RUN npm install --legacy-peer-deps --verbose

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Update npm in production stage too
RUN npm install -g npm@latest

# Copy package files
COPY package*.json ./

# Install only production dependencies with additional flags to handle problematic packages
# Use npm install instead of npm ci for production dependencies
RUN npm install --omit=dev --no-optional --legacy-peer-deps --verbose

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy any other necessary files
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]