import { db } from "../db/index.js";
import { video, renderJob, script } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { CreateEditorJobBody, VideoMetadata } from "../api/schemas/job-schemas.js";
import { deductCredits, hasEnoughCredits } from "./credit-service.js";
import { AppError } from "../lib/errors.js";
import {
    getOrCreateSeries,
    getNextEpisodeNumber,
    incrementSeriesEpisodeCount,
    createVideoRecord,
    createRenderJob,
    createScriptRecord,
    determineVideoTitle,
    CreateJobResult
} from "./shared-video-service.js";

interface CreateEditorVideoJobParams {
    userId: string;
    body: CreateEditorJobBody;
    existingSeriesId?: string;
    isDraft?: boolean;
}

interface CreateEditorDraftParams {
    userId: string;
    nicheId: string | null;
    nicheName?: string;
    episodeTitle?: string;
    scriptIdea?: string;
    duration?: number;
    visualStyle?: string;
    approvedScript: {
        story: string;
        wordCount: number;
        estimatedDurationSeconds: number;
    };
}

/**
 * Creates a draft video for editor mode workflow
 * Called when the user approves the script to get a videoId for subsequent steps
 */
export async function createEditorDraftVideo(params: CreateEditorDraftParams): Promise<{ videoId: string }> {
    const {
        userId,
        nicheId,
        nicheName,
        episodeTitle = "",
        scriptIdea = "",
        duration = 0.5,
        visualStyle = "comic",
        approvedScript,
    } = params;

    // Create initial script version
    const initialScriptVersion = {
        id: crypto.randomUUID(),
        story: approvedScript.story,
        wordCount: approvedScript.wordCount,
        estimatedDurationSeconds: approvedScript.estimatedDurationSeconds,
        generatedAt: new Date().toISOString(),
    };

    // Build minimal metadata for draft
    const metadata: VideoMetadata = {
        duration,
        segments: 0, // Will be updated when visuals are generated
        visualFormat: "image",
        visualStyle,
        scriptIdea,
        nicheId: nicheId ?? undefined,
        nicheName, // Save nicheName for reference
        aspectRatio: "portrait",
        templateId: "simple",
        isEditorMode: true,
        generatedScript: approvedScript,
        // Script version tracking
        scriptVersions: [initialScriptVersion],
        scriptGenerationCount: 1,
        lastScriptGeneratedAt: new Date().toISOString(),
    };

    // Determine title
    const title = episodeTitle || nicheName || "Untitled Video";

    // Create video record as DRAFT
    const videoId = await createVideoRecord({
        userId,
        seriesId: null,
        nicheId,
        title,
        episodeNumber: 1,
        status: "DRAFT",
        metadata
    });

    // Create render job in DRAFT status
    await createRenderJob(videoId, true);

    // Save the approved script to database
    await createScriptRecord(videoId, approvedScript.story);

    return { videoId };
}

/**
 * Creates a video job using editor mode with a pre-generated script
 * The script has already been generated and approved by the user
 */
export async function createEditorVideoJob({
    userId,
    body,
    existingSeriesId,
    isDraft = false
}: CreateEditorVideoJobParams): Promise<CreateJobResult> {
    // 1. Check credits if not a draft
    if (!isDraft) {
        const canAfford = await hasEnoughCredits(userId, 1);
        if (!canAfford) {
            throw new AppError("InsuffCredits", "Insufficient credits to generate this video", 402);
        }
    }

    // 2. Build metadata (editor mode specific)
    const metadata: VideoMetadata = {
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
        templateId: "simple",
        // Editor mode markers
        isEditorMode: true,
        generatedScript: body.generatedScript,
    };

    // 3. Handle series creation/lookup
    const seriesName = body.jobType === "series" ? body.seriesName : undefined;
    const seriesId = await getOrCreateSeries(
        userId,
        body.jobType,
        seriesName,
        body.nicheId,
        body.scriptIdea,
        existingSeriesId
    );

    // 4. Determine episode number
    let episodeNumber = 1;
    if (existingSeriesId) {
        episodeNumber = await getNextEpisodeNumber(existingSeriesId);
        await incrementSeriesEpisodeCount(existingSeriesId);
    }

    // 5. Determine video title
    const isSeries = body.jobType === "series" || !!seriesId;
    const title = determineVideoTitle(
        body.episodeTitle,
        isSeries,
        seriesName,
        episodeNumber
    );

    // 6. Create video record
    // Editor mode starts at SCRIPT_READY since script is already generated
    const initialStatus = isDraft ? "DRAFT" : "SCRIPT_READY";
    
    const videoId = await createVideoRecord({
        userId,
        seriesId,
        nicheId: body.nicheId,
        title,
        episodeNumber,
        status: initialStatus,
        metadata
    });

    // 7. Create render job
    await createRenderJob(videoId, isDraft);

    // 8. Save the pre-generated script to database
    await createScriptRecord(videoId, body.generatedScript.story);

    return {
        success: true,
        message: "Editor job created successfully",
        seriesId,
        videoIds: [videoId]
    };
}

/**
 * Updates an existing editor mode video's metadata
 */
export async function updateEditorVideoMetadata(
    videoId: string,
    userId: string,
    body: CreateEditorJobBody
): Promise<{ success: boolean; message: string }> {
    // Ensure the video belongs to the user
    const existingVideo = await db.select()
        .from(video)
        .where(and(eq(video.id, videoId), eq(video.userId, userId)))
        .limit(1);

    if (existingVideo.length === 0) {
        throw new Error("Video not found or access denied");
    }

    const isDraft = body.isDraft || false;

    // Build editor mode metadata
    const metadata: VideoMetadata = {
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
        templateId: "simple",
        isEditorMode: true,
        generatedScript: body.generatedScript,
    };

    // Update video record (starts at SCRIPT_READY for editor mode)
    await db.update(video)
        .set({
            title: body.episodeTitle || existingVideo[0].title,
            status: isDraft ? "DRAFT" : "SCRIPT_READY",
            metadata,
            updatedAt: new Date()
        })
        .where(eq(video.id, videoId));

    // Update render job status
    await db.update(renderJob)
        .set({
            status: isDraft ? "DRAFT" : "QUEUED",
            updatedAt: new Date()
        })
        .where(eq(renderJob.videoId, videoId));

    // Update or create script record
    const existingScript = await db.select()
        .from(script)
        .where(eq(script.videoId, videoId))
        .limit(1);

    if (existingScript.length > 0) {
        // Update existing script
        await db.update(script)
            .set({
                content: {
                    title: "",
                    segments: [],
                    subtitles: [],
                    rawStory: body.generatedScript.story,
                },
                rawText: body.generatedScript.story,
                isApproved: true,
                updatedAt: new Date()
            })
            .where(eq(script.videoId, videoId));
    } else {
        // Create new script
        await createScriptRecord(videoId, body.generatedScript.story);
    }

    return { success: true, message: "Editor video updated successfully" };
}
