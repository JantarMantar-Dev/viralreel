import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';
import { z } from 'zod';
import { SUBTITLE_STYLES } from '../styles';
import { ImageWithEffect } from '../../effects/index';
import { ImageEffectType } from '../../effects/types';
import { VideoRendererInput } from '../../../types';

export const SimpleCompositionSchema = z.object({
    audioUrl: z.string().optional(),
    segments: z.array(z.object({
        imageAssetPath: z.string(),
        imageEffect: z.enum(['ken-burns', 'zoom-in', 'shine', 'grayscale-to-color', 'blur-to-focus', 'tilt-3d', 'pan', 'circular-morph', 'glitch', 'curtain'] as [string, ...string[]]).optional(),
        duration: z.number(),
    })),
    subtitles: z.array(z.object({
        text: z.string(),
        start: z.number(),
        end: z.number(),
    })).optional(),
    subtitleStyle: z.any().optional(), // CSS properties
    subtitleClassName: z.string().optional(),
    subtitleLocation: z.enum(['top', 'center', 'bottom']).optional(),
    subtitleTemplateId: z.string().optional(),
});

export const SimpleComposition: React.FC<VideoRendererInput> = ({
    audioUrl,
    segments,
    subtitles,
    subtitleStyle,
    subtitleClassName,
    subtitleLocation,
    subtitleTemplateId
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Only apply template style if subtitleTemplateId is set and exists in SUBTITLE_STYLES
    const hasValidSubtitleTemplate = subtitleTemplateId && SUBTITLE_STYLES[subtitleTemplateId];
    const templateStyle = hasValidSubtitleTemplate ? SUBTITLE_STYLES[subtitleTemplateId]?.style || {} : {};

    const segmentStartFrames = React.useMemo(() => {
        let accumulated = 0;
        return segments.map(segment => {
            const start = accumulated;
            accumulated += Math.round((segment.duration || 5) * fps);
            return start;
        });
    }, [segments, fps]);

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            {/* Audio Track */}
            {audioUrl && <Audio src={audioUrl} />}

            {/* Segments: Background Images */}
            {segments.map((segment, index) => {
                const durationInFrames = Math.round((segment.duration || 5) * fps);
                const fromFrame = segmentStartFrames[index];

                return (
                    <Sequence key={`img-${index}`} from={fromFrame} durationInFrames={durationInFrames}>
                        <ImageWithEffect
                            src={segment.imageAssetPath}
                            effect={segment.imageEffect as ImageEffectType}
                            durationInFrames={durationInFrames}
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                        />
                    </Sequence>
                );
            })}

            {/* Subtitles Overlay: Only render if we have a valid subtitle template AND subtitles */}
            {hasValidSubtitleTemplate && subtitles && subtitles.length > 0 && subtitles.map((subtitle, index) => {
                return (
                    <Sequence
                        key={`top-sub-${index}`}
                        from={subtitle.start}
                        durationInFrames={Math.max(1, subtitle.end - subtitle.start)}
                    >
                        <AbsoluteFill style={{
                            justifyContent: subtitleLocation === 'top' ? 'flex-start' : subtitleLocation === 'bottom' ? 'flex-end' : 'center',
                            alignItems: 'center',
                            paddingTop: subtitleLocation === 'top' ? 250 : 0,
                            paddingBottom: subtitleLocation === 'bottom' ? 250 : 0,
                        }}>
                            <div
                                className={subtitleClassName}
                                style={{
                                    textAlign: 'center',
                                    maxWidth: '85%',
                                    ...templateStyle,
                                }}
                            >
                                {subtitle.text}
                            </div>
                        </AbsoluteFill>
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};
