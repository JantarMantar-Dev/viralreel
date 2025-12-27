
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
    image: string;
    duration: number; // seconds
    subtitles: SubtitleSegment[];
    imageEffect?: ImageEffectType;
}

export interface VideoRendererInput {
    audioUrl: string;
    segments: VideoSegment[];
    subtitleStyle?: React.CSSProperties;
}

// --- Script/Generation Types ---

export interface ScriptSegment {
    visualPrompt: string;
    dialogue: string;
    duration?: number; // estimated duration
    imageAssetPath?: string; // path to generated image
    imageEffect?: string;
    // Add other script-specific fields as needed
}

export interface ScriptContent {
    segments: ScriptSegment[];
    // Add other top-level script fields if needed, e.g. global audio settings
    audioUrl?: string; // Maybe the script has a decided audio URL?
}
