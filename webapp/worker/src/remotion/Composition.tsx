
import { AbsoluteFill, Audio, Img, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';
import { z } from 'zod';

export const MyCompositionSchema = z.object({
    audioUrl: z.string(),
    segments: z.array(z.object({
        image: z.string(),
        duration: z.number(), // Duration in seconds
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

export const MyComposition: React.FC<z.infer<typeof MyCompositionSchema>> = ({
    audioUrl,
    segments,
    subtitleStyle,
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
                        <AbsoluteFill>
                            <Img
                                src={segment.image}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </AbsoluteFill>
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
