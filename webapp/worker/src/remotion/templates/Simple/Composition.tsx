import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';
import { z } from 'zod';
import { ImageWithEffect } from '../../effects/index';
import { ImageEffectType } from '../../effects/types';
import { VideoRendererInput } from '../../../types.js';

export const SimpleCompositionSchema = z.object({
    audioUrl: z.string(),
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
    subtitleStyle: z.record(z.string(), z.union([z.string(), z.number()])).optional(), // CSS properties
    subtitleClassName: z.string().optional(),
    subtitleLocation: z.enum(['top', 'center', 'bottom']).optional(),
});

export const SimpleComposition: React.FC<VideoRendererInput> = ({
    audioUrl,
    segments,
    subtitles,
    subtitleStyle,
    subtitleClassName,
    subtitleLocation
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

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

            {/* Subtitles Overlay */}
            <AbsoluteFill style={{
                justifyContent: subtitleLocation === 'top' ? 'flex-start' : subtitleLocation === 'bottom' ? 'flex-end' : 'center',
                alignItems: 'center',
                paddingTop: subtitleLocation === 'top' ? 150 : 0,
                paddingBottom: subtitleLocation === 'bottom' ? 150 : 0,
            }}>
                {subtitles && subtitles.map((subtitle, index) => {
                    return (
                        <Sequence
                            key={`top-sub-${index}`}
                            from={subtitle.start}
                            durationInFrames={Math.max(1, subtitle.end - subtitle.start)}
                        >
                            <div
                                className={subtitleClassName}
                                style={{
                                    fontSize: 50,
                                    color: 'white',
                                    fontFamily: 'sans-serif',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                    textAlign: 'center',
                                    ...subtitleStyle
                                }}
                            >
                                {subtitle.text}
                            </div>
                        </Sequence>
                    );
                })}
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
