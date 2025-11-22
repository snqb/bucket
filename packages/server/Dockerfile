# Use Node.js 18 Alpine for smaller size
FROM node:18-alpine AS base

# Install dependencies needed for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Copy source code
COPY . .

# Create data and logs directories
RUN mkdir -p data logs

# Expose port
EXPOSE 8040

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8040/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start development server with hot reload
CMD ["pnpm", "dev"]

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create data and logs directories with correct permissions
RUN mkdir -p data logs && \
    chown -R nodejs:nodejs data logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8040

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8040/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start production server
CMD ["node", "dist/server.js"]