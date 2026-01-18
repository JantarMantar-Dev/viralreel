# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for the server
COPY server/package*.json ./server/

# Install dependencies for the server
WORKDIR /app/server
RUN npm install

# Copy shared code and server source
WORKDIR /app
COPY shared/ ./shared/
COPY server/ ./server/

# Debug: Show what was copied
RUN echo "=== Checking /app structure ===" && \
    ls -la /app && \
    echo "=== Checking /app/server structure ===" && \
    ls -la /app/server && \
    echo "=== Checking /app/server/src exists ===" && \
    ls -la /app/server/src || echo "ERROR: /app/server/src not found!" && \
    echo "=== Checking /app/shared structure ===" && \
    ls -la /app/shared

# Build the application
WORKDIR /app/server
RUN echo "=== Running TypeScript build ===" && \
    NODE_OPTIONS="--max-old-space-size=768" npm run build:prod 2>&1 && \
    echo "=== Build output ===" && \
    ls -la dist/ && \
    test -f dist/index.js || (echo "ERROR: dist/index.js not found!" && exit 1)

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

ARG PORT=3000
ENV PORT=$PORT

ARG TRUSTED_ORIGINS
ENV TRUSTED_ORIGINS=$TRUSTED_ORIGINS

ARG CLIENT_URL
ENV CLIENT_URL=$CLIENT_URL

ARG BETTER_AUTH_SECRET
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET

ARG BETTER_AUTH_URL
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL

ARG GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID

ARG GOOGLE_CLIENT_SECRET
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

ARG STRIPE_SECRET_KEY
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY

ARG S3_ENDPOINT_URL
ENV S3_ENDPOINT_URL=$S3_ENDPOINT_URL

ARG S3_REGION
ENV S3_REGION=$S3_REGION

ARG S3_ACCESS_KEY_ID
ENV S3_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID

ARG S3_SECRET_ACCESS_KEY
ENV S3_SECRET_ACCESS_KEY=$S3_SECRET_ACCESS_KEY

ARG S3_BUCKET_NAME
ENV S3_BUCKET_NAME=$S3_BUCKET_NAME

ARG SMTP_OUT_SERVER
ENV SMTP_OUT_SERVER=$SMTP_OUT_SERVER

ARG SMTP_PORT
ENV SMTP_PORT=$SMTP_PORT

ARG SMTP_EMAIL_USER
ENV SMTP_EMAIL_USER=$SMTP_EMAIL_USER

ARG SMTP_EMAIL_PASS
ENV SMTP_EMAIL_PASS=$SMTP_EMAIL_PASS

ARG MOCK_EMAIL
ENV MOCK_EMAIL=$MOCK_EMAIL

ARG GOOGLE_API_KEY
ENV GOOGLE_API_KEY=$GOOGLE_API_KEY

ARG VIDEO_WORK_DIR
ENV VIDEO_WORK_DIR=$VIDEO_WORK_DIR

# Copy package files (from server directory)
COPY server/package*.json ./

# Install only production dependencies
RUN npm install --production && \
    npm cache clean --force


# Copy built application
COPY --from=builder /app/server/dist ./dist
# Copy drizzle migrations
COPY --from=builder /app/server/drizzle ./drizzle

# Verify the copy worked
RUN echo "=== Production stage dist contents ===" && \
    ls -la dist/ && \
    test -f dist/index.js || (echo "ERROR: dist/index.js not copied!" && exit 1)

# Use non-root user
USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
