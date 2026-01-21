
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestFastify } from '../../../test/helpers/fastify.js';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { createTables } from '../../../test/db-helper.js';
import * as schema from '../../../test/sqlite-schema.js';
import { eq } from 'drizzle-orm';

// ============================================================================
// Setup In-Memory DB
// ============================================================================

const sqlite = new Database(':memory:');
const db = drizzle(sqlite, { schema });

// Apply schema migrations (create tables)
createTables(sqlite);

// ============================================================================
// Mock Modules
// ============================================================================

// 1. Mock the DB module to use our in-memory SQLite instance
vi.mock('../../../db/index.js', () => ({
  db: db,
}));

// 2. Mock the Schema module to use our SQLite schema definitions
// This is critical because the application code imports 'pg-core' tables,
// but we need it to use 'sqlite-core' tables for this test context.
vi.mock('../../../db/schema.js', () => ({
  ...schema,
}));

// 3. Mock other services
vi.mock('../../../services/credit-service.js', () => ({
  hasEnoughCredits: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../../lib/storage.js', () => ({
  storageProvider: {
    getSignedUrlFromFullUrl: vi.fn().mockResolvedValue('https://signed.url'),
  },
}));

// ============================================================================
// Test Suite
// ============================================================================

describe('Render Date Fix Integration (SQLite)', () => {
  let fastify: FastifyInstance;
  const testUserId = 'test_user_123';

  beforeEach(async () => {
    // Clear data between tests
    sqlite.exec(`DELETE FROM render_job; DELETE FROM video; DELETE FROM user;`);

    // Seed User
    await db.insert(schema.user).values({
      id: testUserId,
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    fastify = await createTestFastify({
      authenticated: true,
      user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
      session: { userId: testUserId }
    });

    // Register routes
    const jobRoutes = await import('../../jobs.js');
    const editorRenderRoutes = await import('../../editor-render.js');
    const projectRoutes = await import('../../projects.js');

    fastify.register(jobRoutes.default, { prefix: '/api/jobs' });
    fastify.register(editorRenderRoutes.default, { prefix: '/api/editor/render' });
    fastify.register(projectRoutes.default, { prefix: '/api/projects' });

    await fastify.ready();
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('Reset Job Timer Logic', () => {
    it('should reset createdAt when triggering render from Draft (Standard Mode)', async () => {
      const videoId = 'video-std-1';
      const renderJobId = 'job-std-1';
      const oldDate = new Date('2023-01-01T00:00:00Z');

      // 1. Setup Draft Video & Job with OLD date
      await db.insert(schema.video).values({
        id: videoId,
        userId: testUserId,
        title: 'Draft Video',
        status: 'DRAFT',
        mode: 'auto',
        createdAt: oldDate,
        updatedAt: oldDate,
      });

      await db.insert(schema.renderJob).values({
        id: renderJobId,
        videoId: videoId,
        status: 'DRAFT',
        createdAt: oldDate,
        updatedAt: oldDate,
      });

      // 2. Trigger Render
      const response = await fastify.inject({
        method: 'POST',
        url: `/api/jobs/${videoId}/render`,
      });

      expect(response.statusCode).toBe(200);

      // 3. Verify render_job.createdAt is updated to NOW
      const jobs = await db.select().from(schema.renderJob).where(eq(schema.renderJob.id, renderJobId));
      expect(jobs).toHaveLength(1);

      const job = jobs[0];
      expect(job.status).toBe('QUEUED');

      // Check date
      expect(job.createdAt).not.toEqual(oldDate);
      const now = new Date();
      // Should be within last 2 seconds
      expect(now.getTime() - new Date(job.createdAt!).getTime()).toBeLessThan(2000);
    });

    it('should reset createdAt when triggering render from Editor', async () => {
      const videoId = 'video-editor-1';
      const renderJobId = 'job-editor-1';
      const oldDate = new Date('2023-01-01T00:00:00Z');

      // 1. Setup Draft Editor Video
      await db.insert(schema.video).values({
        id: videoId,
        userId: testUserId,
        title: 'Editor Video',
        status: 'DRAFT',
        mode: 'editor',
        createdAt: oldDate,
        updatedAt: oldDate,
        metadata: {
          approvedScript: true,
          editorMode: true,
          segments: [{}]
        }
      });

      // 2. Setup existing job (simulating a retry or re-render)
      await db.insert(schema.renderJob).values({
        id: renderJobId,
        videoId: videoId,
        status: 'DRAFT',
        createdAt: oldDate,
        updatedAt: oldDate,
      });

      // 3. Trigger Editor Render
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/editor/render',
        payload: { videoId: videoId }
      });

      expect(response.statusCode).toBe(200);

      // 4. Verify DB
      const jobs = await db.select().from(schema.renderJob).where(eq(schema.renderJob.id, renderJobId));
      expect(jobs).toHaveLength(1);

      const job = jobs[0];
      expect(job.status).toBe('VIDEO_QUEUED');

      // Check date updated
      expect(job.createdAt).not.toEqual(oldDate);
      const now = new Date();
      expect(now.getTime() - new Date(job.createdAt!).getTime()).toBeLessThan(2000);
    });

    it('should return renderJob.createdAt as date for Rendering projects', async () => {
      const videoId = 'video-rendering-1';
      const renderJobId = 'job-rendering-1';

      const draftDate = new Date('2023-01-01T10:00:00Z');
      const renderStartDate = new Date('2023-01-01T12:00:00Z'); // 2 hours later

      // 1. Setup Rendering Video
      await db.insert(schema.video).values({
        id: videoId,
        userId: testUserId,
        title: 'Rendering Video',
        status: 'GENERATING', // API maps this to "Rendering"
        mode: 'auto',
        createdAt: draftDate,
        updatedAt: draftDate,
      });

      await db.insert(schema.renderJob).values({
        id: renderJobId,
        videoId: videoId,
        status: 'PROCESSING',
        createdAt: renderStartDate, // THIS is the date we want
        updatedAt: renderStartDate,
      });

      // 2. Fetch Projects
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/projects?type=video',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);

      const project = body.projects.find((p: any) => p.id === videoId);
      expect(project).toBeDefined();
      expect(project.status).toBe('Rendering');

      // 3. Verify the date returned is the Render Job Start Date, NOT the Video Creation Date
      // API returns ISO strings, so we compare those
      expect(project.date).toBe(renderStartDate.toISOString());
      expect(project.date).not.toBe(draftDate.toISOString());
    });
  });
});
