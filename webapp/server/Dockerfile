# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build:prod

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production && \
    npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
# Copy drizzle migrations
COPY --from=builder /app/drizzle ./drizzle

# Use non-root user
USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
