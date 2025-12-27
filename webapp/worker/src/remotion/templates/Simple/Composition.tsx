import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';
import { z } from 'zod';
import { ImageWithEffect } from '../../effects/index.js';
import { ImageEffectType } from '../../effects/types.js';

export const SimpleCompositionSchema = z.object({
    audioUrl: z.string(),
    segments: z.array(z.object({
        image: z.string(),
        imageEffect: z.enum(['ken-burns', 'zoom-in', 'shine', 'grayscale-to-color', 'blur-to-focus', 'tilt-3d', 'pan', 'circular-morph', 'glitch', 'curtain'] as [string, ...string[]]).optional(),
        duration: z.number(),
        subtitles: z.array(z.object({
            text: z.string(),
            start: z.number(),
            end: z.number(),
        }))
    }).refine((segment) => {
        // Validation: Subtitles must not exceed segment duration
        const maxDurationFrames = segment.duration * 30; // Assuming 30fps
        return segment.subtitles.every(sub => sub.end <= maxDurationFrames);
    }, {
        message: "Subtitle end time cannot exceed segment duration"
    })),
    subtitleStyle: z.record(z.string(), z.union([z.string(), z.number()])).optional(), // CSS properties
});

export const SimpleComposition: React.FC<z.infer<typeof SimpleCompositionSchema>> = ({
    audioUrl,
    segments,
    subtitleStyle,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // console.log(`[Frame ${frame}] Segments:`, JSON.stringify(segments.map(s => ({ img: s.image, duration: s.duration })), null, 2));

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
                            src={segment.image}
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

            {/* Segments: Subtitles */}
            <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', bottom: 100, top: undefined, height: 150 }}>
                {segments.map((segment, index) => {
                    const segmentStartFrame = segmentStartFrames[index];

                    return segment.subtitles.map((subtitle, subIndex) => {
                        const absStart = segmentStartFrame + subtitle.start;
                        const absEnd = segmentStartFrame + subtitle.end;

                        return (
                            <Sequence
                                key={`sub-${index}-${subIndex}`}
                                from={absStart}
                                durationInFrames={absEnd - absStart}
                            >
                                <div style={{
                                    fontSize: 50,
                                    color: 'white',
                                    fontFamily: 'sans-serif',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                    textAlign: 'center',
                                    ...subtitleStyle
                                }}>
                                    {subtitle.text}
                                </div>
                            </Sequence>
                        );
                    });
                })}
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
