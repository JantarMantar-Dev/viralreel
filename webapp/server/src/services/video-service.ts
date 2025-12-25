import { db } from "../db/index.js";
import { series, video, renderJob, script } from "../db/schema.js";
import { nanoid } from "nanoid";
import { CreateJobBody } from "../api/jobs.js";
import { eq, desc, and, sql, inArray, or } from "drizzle-orm";

interface CreateVideoJobParams {
    userId: string;
    body: CreateJobBody;
    existingSeriesId?: string; // Optional: If adding to existing series
    isDraft?: boolean;
}

export async function createVideoJob({ userId, body, existingSeriesId, isDraft = false }: CreateVideoJobParams) {
    // Common metadata for all videos in this request
    const metadata = {
        duration: body.duration,
        segments: body.segments,
        visualFormat: body.visualFormat,
        visualStyle: body.visualStyle,
        voiceId: body.voiceId,
        subtitleTemplateId: body.subtitleTemplateId,
        musicId: body.musicId,
        scriptIdea: body.scriptIdea,
        nicheId: body.nicheId ?? undefined,
        aspectRatio: body.aspectRatio || "portrait",
    };

    let seriesId: string | null = existingSeriesId || null;
    const createdVideos: string[] = [];

    // 1. Create Series if requested and not provided
    if (body.jobType === "series" && !seriesId) {
        seriesId = nanoid();
        await db.insert(series).values({
            id: seriesId,
            userId,
            nicheId: body.nicheId || null,
            name: body.seriesName,
            description: body.scriptIdea
        });
    }

    // 2. Determine Episode Number
    let episodeNumber = 1;

    // If adding to an existing series, find the next episode number
    if (seriesId) {
        // We need to check if we are creating a new series or appending to one
        // If existingSeriesId was passed, we definitely want to append.
        // If we just created the series (above), it's episode 1.

        if (existingSeriesId) {
            const lastVideo = await db.select({ episodeNumber: video.episodeNumber })
                .from(video)
                .where(eq(video.seriesId, seriesId))
                .orderBy(desc(video.episodeNumber))
                .limit(1);

            if (lastVideo.length > 0) {
                episodeNumber = (lastVideo[0].episodeNumber || 0) + 1;
            }

            // Increment episode count for existing series
            await db.update(series)
                .set({
                    episodeCount: sql`${series.episodeCount} + 1`,
                    updatedAt: new Date()
                })
                .where(eq(series.id, existingSeriesId));
        }
    }

    // 3. Create Video entry (1 video per request for now)
    const videoId = nanoid();
    const isSeries = body.jobType === "series" || !!seriesId;

    // Determine title
    // If body.episodeTitle is set, use it.
    // If not, and it's a series, format as "Series Name - Episode X"
    let title = body.episodeTitle;
    if (!title) {
        if (isSeries) {
            // For new series, we have body.seriesName.
            // For existing series, we might need to fetch the name if we really need it in the title fallback
            // But usually frontend sends episodeTitle.
            // Let's assume for now we use what we have or a generic fallback
            title = body.jobType === "series" ? `${body.seriesName} - Episode ${episodeNumber}` : `Episode ${episodeNumber}`;
        } else {
            title = "Untitled Video";
        }
    }

    await db.insert(video).values({
        id: videoId,
        userId,
        seriesId, // Link to series if it exists
        nicheId: body.nicheId || null,
        title,
        episodeNumber,
        status: isDraft ? "DRAFT" : "SCRIPTING", // Initial status
        metadata: metadata
    });

    createdVideos.push(videoId);

    // 4. Create Render Job
    await db.insert(renderJob).values({
        id: nanoid(),
        videoId,
        status: isDraft ? "DRAFT" : "QUEUED",
        progress: 0
    });

    return {
        success: true,
        message: "Job created successfully",
        seriesId,
        videoIds: createdVideos
    };
}

export async function deleteVideo(videoId: string, userId: string) {
    // Ensure the video belongs to the user
    const existingVideo = await db.select()
        .from(video)
        .where(and(eq(video.id, videoId), eq(video.userId, userId)))
        .limit(1);

    if (existingVideo.length === 0) {
        throw new Error("Video not found or access denied");
    }

    const v = existingVideo[0];

    // Check for active render jobs
    const activeJobs = await db.select()
        .from(renderJob)
        .where(
            and(
                eq(renderJob.videoId, videoId),
                or(eq(renderJob.status, "QUEUED"), eq(renderJob.status, "PROCESSING"))
            )
        )
        .limit(1);

    if (activeJobs.length > 0) {
        throw new Error("Cannot delete this video until the active generation job is finished.");
    }

    // If part of a series, decrement episode count
    if (v.seriesId) {
        await db.update(series)
            .set({
                episodeCount: sql`${series.episodeCount} - 1`,
                updatedAt: new Date()
            })
            .where(eq(series.id, v.seriesId));
    }

    // Delete related records first
    await db.delete(renderJob).where(eq(renderJob.videoId, videoId));
    await db.delete(script).where(eq(script.videoId, videoId));
    await db.delete(video).where(eq(video.id, videoId));

    return { success: true, message: "Video deleted successfully" };
}

export async function queueVideoRender(videoId: string, userId: string) {
    // Ensure the video belongs to the user and is in DRAFT
    const existingVideo = await db.select()
        .from(video)
        .where(and(eq(video.id, videoId), eq(video.userId, userId)))
        .limit(1);

    if (existingVideo.length === 0) {
        throw new Error("Video not found or access denied");
    }

    // Update video status to SCRIPTING (start of pipeline)
    await db.update(video)
        .set({ status: "SCRIPTING", updatedAt: new Date() })
        .where(eq(video.id, videoId));

    // Update render_job status to QUEUED
    await db.update(renderJob)
        .set({ status: "QUEUED", updatedAt: new Date() })
        .where(eq(renderJob.videoId, videoId));

    return { success: true, message: "Rendering queued successfully" };
}

export async function updateVideoMetadata(videoId: string, userId: string, body: CreateJobBody) {
    // Ensure the video belongs to the user
    const existingVideo = await db.select()
        .from(video)
        .where(and(eq(video.id, videoId), eq(video.userId, userId)))
        .limit(1);

    if (existingVideo.length === 0) {
        throw new Error("Video not found or access denied");
    }

    const isDraft = body.isDraft || false;

    // Update metadata from the same body structure as creation
    const metadata = {
        duration: body.duration,
        segments: body.segments,
        visualFormat: body.visualFormat,
        visualStyle: body.visualStyle,
        voiceId: body.voiceId,
        subtitleTemplateId: body.subtitleTemplateId,
        musicId: body.musicId,
        scriptIdea: body.scriptIdea,
        nicheId: body.nicheId ?? undefined,
        aspectRatio: body.aspectRatio || "portrait",
    };

    await db.update(video)
        .set({
            title: body.episodeTitle || existingVideo[0].title,
            status: isDraft ? "DRAFT" : "SCRIPTING",
            metadata,
            updatedAt: new Date()
        })
        .where(eq(video.id, videoId));

    // Update render_job status as well
    await db.update(renderJob)
        .set({
            status: isDraft ? "DRAFT" : "QUEUED",
            updatedAt: new Date()
        })
        .where(eq(renderJob.videoId, videoId));

    return { success: true, message: "Video updated successfully" };
}

export async function deleteSeries(seriesId: string, userId: string) {
    // 1. Ensure the series belongs to the user
    const existingSeries = await db.select()
        .from(series)
        .where(and(eq(series.id, seriesId), eq(series.userId, userId)))
        .limit(1);

    if (existingSeries.length === 0) {
        throw new Error("Series not found or access denied");
    }

    // 2. Find all video IDs in this series
    const seriesVideos = await db.select({ id: video.id })
        .from(video)
        .where(eq(video.seriesId, seriesId));

    const videoIds = seriesVideos.map(v => v.id);

    if (videoIds.length > 0) {
        // 3. Check for any active render jobs in this series
        const activeJobs = await db.select()
            .from(renderJob)
            .where(
                and(
                    inArray(renderJob.videoId, videoIds),
                    or(eq(renderJob.status, "QUEUED"), eq(renderJob.status, "PROCESSING"))
                )
            )
            .limit(1);

        if (activeJobs.length > 0) {
            throw new Error("Cannot delete this series while one or more videos have active generation jobs.");
        }

        // 4. Delete related records for all videos in the series
        await db.delete(renderJob).where(inArray(renderJob.videoId, videoIds));
        await db.delete(script).where(inArray(script.videoId, videoIds));
        await db.delete(video).where(inArray(video.id, videoIds));
    }

    // 4. Delete the series itself
    await db.delete(series).where(eq(series.id, seriesId));

    return { success: true, message: "Series and all associated videos deleted successfully" };
}
