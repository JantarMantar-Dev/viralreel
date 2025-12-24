import { FastifyPluginAsync } from "fastify";
import { db } from "../db/index.js";
import { video, series, renderJob, contentNiche } from "../db/schema.js";
import { eq, desc, and, isNull, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";

// --- Helper Functions ---

async function fetchSeriesProjects(userId: string) {
    // Fetch series with their episode counts and check if any episode is rendering
    // This is a bit complex with pure Drizzle aggregation, so we'll fetch series first
    // then efficiently query standard metadata.
    // For scale, we'd use raw SQL or advanced aggregation, but for now:

    const allSeries = await db.select({
        id: series.id,
        name: series.name,
        description: series.description,
        createdAt: series.createdAt,
        nicheName: contentNiche.name // Optional: get nice info
    })
        .from(series)
        .leftJoin(contentNiche, eq(series.nicheId, contentNiche.id))
        .where(eq(series.userId, userId))
        .orderBy(desc(series.createdAt));

    // For each series, we need:
    // 1. Episode Count
    // 2. "Status" - if any episode is active/rendering
    // 3. Thumbnail - use the first episode's thumbnail

    const seriesProjects = await Promise.all(allSeries.map(async (s) => {
        // Get episodes
        const episodes = await db.select({
            id: video.id,
            status: video.status,
            thumbnailUrl: video.thumbnailUrl,
            metadata: video.metadata,
            renderStatus: renderJob.status
        })
            .from(video)
            .leftJoin(renderJob, eq(video.id, renderJob.videoId))
            .where(eq(video.seriesId, s.id))
            .orderBy(desc(video.createdAt)); // Newest first

        const episodeCount = episodes.length;
        const thumbnail = episodes[0]?.thumbnailUrl || null;
        const duration = episodes[0]?.metadata ? (episodes[0].metadata as any).duration : null;

        // Determine aggregated status
        // If ANY episode is in a "working" state (rendering, scripting), the series is "Rendering"
        const isRendering = episodes.some(e =>
            e.renderStatus === "QUEUED" ||
            e.renderStatus === "PROCESSING" ||
            e.status === "SCRIPTING" ||
            e.status === "GENERATING"
        );

        // If NO episodes, it's a "Draft" / "Empty"
        // If all completed, "Completed"
        let status = "Completed";
        if (episodeCount === 0) status = "Draft";
        else if (isRendering) status = "Rendering";

        return {
            id: s.id,
            title: s.name,
            description: s.description || "",
            thumbnailUrl: thumbnail,
            type: "Series" as const, // Explicit type
            status,
            videoCount: episodeCount,
            date: s.createdAt,
            duration: duration, // Showing duration of latest episode as proxy
            isSd: false, // placeholders
            isHd: true,
            is4k: false
        };
    }));

    return seriesProjects;
}

async function fetchVideoProjects(userId: string) {
    // Fetch videos that are NOT part of any series (seriesId is NULL)
    const videos = await db.select({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        createdAt: video.createdAt,
        status: video.status,
        metadata: video.metadata,
        renderStatus: renderJob.status
    })
        .from(video)
        .leftJoin(renderJob, eq(video.id, renderJob.videoId))
        .where(
            and(
                eq(video.userId, userId),
                isNull(video.seriesId) // STANDALONE ONLY
            )
        )
        .orderBy(desc(video.createdAt));

    return videos.map(v => {
        // Map status
        // Priority: Render Job Status > Video Status
        let status = "Completed";
        if (v.renderStatus === "QUEUED" || v.renderStatus === "PROCESSING") {
            status = "Rendering";
        } else if (v.status === "DRAFT") {
            status = "Draft";
        } else if (v.status === "SCRIPTING") {
            status = "Rendering"; // Grouping scripting into rendering for dashboard simplicity
        } else if (v.renderStatus === "FAILED" || v.status === "FAILED") {
            status = "Draft"; // or Failed
        }

        return {
            id: v.id,
            title: v.title,
            description: v.description || (v.metadata as any)?.scriptIdea || "",
            thumbnailUrl: v.thumbnailUrl,
            type: "Single Video" as const,
            status,
            videoCount: undefined,
            date: v.createdAt,
            duration: (v.metadata as any)?.duration,
            isSd: false,
            isHd: true,
            is4k: false
        };
    });
}

// --- Routes ---

const projectsRoutes: FastifyPluginAsync = async (fastify) => {
    // GET /api/projects
    fastify.withTypeProvider<ZodTypeProvider>().get("/", {
        schema: {
            querystring: z.object({
                type: z.enum(["all", "series", "video"]).optional().default("all")
            })
        }
    }, async (request, reply) => {
        const userId = (request as any).userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { type } = request.query as { type: "all" | "series" | "video" };

        try {
            let projects: any[] = [];

            if (type === "all" || type === "series") {
                const seriesData = await fetchSeriesProjects(userId);
                projects = [...projects, ...seriesData];
            }

            if (type === "all" || type === "video") {
                const videoData = await fetchVideoProjects(userId);
                projects = [...projects, ...videoData];
            }

            // Sort combined result by date descending
            projects.sort((a, b) => {
                const dateA = new Date(a.date || 0).getTime();
                const dateB = new Date(b.date || 0).getTime();
                return dateB - dateA;
            });

            return { success: true, projects };

        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: "Failed to fetch projects" });
        }
    });
}
export default projectsRoutes;
