import { db } from "../db/index.js";
import { series, video, renderJob, script } from "../db/schema.js";
import { nanoid } from "nanoid";
import { eq, desc, sql } from "drizzle-orm";
import { VideoMetadata } from "../api/schemas/job-schemas.js";

/**
 * Common parameters for creating a video job
 */
export interface BaseCreateJobParams {
    userId: string;
    jobType: "video" | "series";
    seriesName?: string;
    episodeTitle: string;
    nicheId: string | null;
    existingSeriesId?: string;
    isDraft: boolean;
    metadata: VideoMetadata;
}

/**
 * Result of creating a video job
 */
export interface CreateJobResult {
    success: boolean;
    message: string;
    seriesId: string | null;
    videoIds: string[];
}

/**
 * Creates or gets a series for the video
 */
export async function getOrCreateSeries(
    userId: string,
    jobType: "video" | "series",
    seriesName: string | undefined,
    nicheId: string | null,
    scriptIdea: string,
    existingSeriesId?: string
): Promise<string | null> {
    if (existingSeriesId) {
        return existingSeriesId;
    }

    if (jobType === "series" && seriesName) {
        const seriesId = nanoid();
        await db.insert(series).values({
            id: seriesId,
            userId,
            nicheId: nicheId || null,
            name: seriesName,
            description: scriptIdea
        });
        return seriesId;
    }

    return null;
}

/**
 * Determines the next episode number for a series
 */
export async function getNextEpisodeNumber(seriesId: string | null): Promise<number> {
    if (!seriesId) return 1;

    const lastVideo = await db.select({ episodeNumber: video.episodeNumber })
        .from(video)
        .where(eq(video.seriesId, seriesId))
        .orderBy(desc(video.episodeNumber))
        .limit(1);

    return lastVideo.length > 0 ? (lastVideo[0].episodeNumber || 0) + 1 : 1;
}

/**
 * Increments the episode count for an existing series
 */
export async function incrementSeriesEpisodeCount(seriesId: string): Promise<void> {
    await db.update(series)
        .set({
            episodeCount: sql`${series.episodeCount} + 1`,
            updatedAt: new Date()
        })
        .where(eq(series.id, seriesId));
}

/**
 * Creates the video record in the database
 */
export async function createVideoRecord(params: {
    userId: string;
    seriesId: string | null;
    nicheId: string | null;
    title: string;
    episodeNumber: number;
    status: string;
    metadata: VideoMetadata;
}): Promise<string> {
    const videoId = nanoid();

    await db.insert(video).values({
        id: videoId,
        userId: params.userId,
        seriesId: params.seriesId,
        nicheId: params.nicheId || null,
        title: params.title,
        episodeNumber: params.episodeNumber,
        status: params.status,
        metadata: params.metadata
    });

    return videoId;
}

/**
 * Creates a render job for a video
 */
export async function createRenderJob(videoId: string, isDraft: boolean): Promise<string> {
    const renderJobId = nanoid();
    const status = isDraft ? "DRAFT" : "QUEUED";

    await db.insert(renderJob).values({
        id: renderJobId,
        videoId,
        status,
        progress: 0
    });

    return renderJobId;
}

/**
 * Creates a script record for editor mode (pre-generated script)
 */
export async function createScriptRecord(
    videoId: string,
    story: string
): Promise<string> {
    const scriptId = nanoid();

    await db.insert(script).values({
        id: scriptId,
        videoId,
        content: {
            title: "",
            segments: [],
            subtitles: [],
            rawStory: story,
        },
        rawText: story,
        isApproved: true,
    });

    return scriptId;
}

/**
 * Determines the video title based on input
 */
export function determineVideoTitle(
    episodeTitle: string | undefined,
    isSeries: boolean,
    seriesName: string | undefined,
    episodeNumber: number
): string {
    if (episodeTitle) {
        return episodeTitle;
    }

    if (isSeries && seriesName) {
        return `${seriesName} - Episode ${episodeNumber}`;
    }

    return isSeries ? `Episode ${episodeNumber}` : "Untitled Video";
}
