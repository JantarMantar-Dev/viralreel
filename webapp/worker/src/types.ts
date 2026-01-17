
import { ImageEffectType } from './remotion/effects/types.js';
import React from 'react';

// --- Renderer Types ---

export interface SubtitleSegment {
    text: string;
    start: number; // relative start frame (0 to duration) or absolute? Schema says 'start', 'end'. 
    // Usually relative to segment start if nested in segment.
    end: number;
}

export interface VideoSegment {
    imageAssetPath: string;
    duration: number; // seconds
    imageEffect?: ImageEffectType;
}

export interface VideoRendererInput {
    audioUrl: string;
    segments: VideoSegment[];
    subtitles?: SubtitleSegment[]; // Top-level word-level subtitles
    subtitleStyle?: React.CSSProperties;
    subtitleClassName?: string; // For Tailwind classes
    subtitleLocation?: 'top' | 'center' | 'bottom';
    subtitleTemplateId?: string;
}

// --- Script/Generation Types ---

export interface ScriptSegment {
    visualPrompt: string;
    dialogue: string;
    duration?: number; // estimated duration
    imageAssetPath?: string; // path to generated image (local or public URL)
    imageKey?: string;
    imageSignedUrl?: string;
    imageSignedUrlExpiresAt?: string;
    imageEffect?: string;
    // Add other script-specific fields as needed
}

export interface ScriptContent {
    segments: ScriptSegment[];
    title: string;
    description?: string;
    subtitles?: SubtitleSegment[];
    audioKey?: string;
    audioUrl?: string;
    audioSignedUrl?: string;
    audioSignedUrlExpiresAt?: string;
}
