import { db } from "../db/index.js";
import { series, video, renderJob } from "../db/schema.js";
import { nanoid } from "nanoid";
import { CreateJobBody } from "../api/jobs.js";
import { eq, desc } from "drizzle-orm";

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
