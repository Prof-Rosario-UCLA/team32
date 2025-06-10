# Build stage
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Set production environment and build-time environment variables
ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_URL=https://bruinhottake.brandonle.dev
ARG NEXT_PUBLIC_WS_URL=wss://bruinhottake.brandonle.dev
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Set production environment and runtime environment variables
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=https://bruinhottake.brandonle.dev
ENV NEXT_PUBLIC_WS_URL=wss://bruinhottake.brandonle.dev

# Expose port 3000
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"] 