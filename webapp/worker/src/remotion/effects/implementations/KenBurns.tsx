import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { ImageEffectProps } from '../types.js';

export const KenBurnsEffect: React.FC<ImageEffectProps> = ({ src, style, durationInFrames }) => {
    const frame = useCurrentFrame();

    // Scale from 1 to 1.15 over the duration
    const scale = interpolate(frame, [0, durationInFrames], [1, 1.15]);

    // Slight translation
    const translate = interpolate(frame, [0, durationInFrames], [0, -20]);

    return (
        <AbsoluteFill style={{ overflow: 'hidden', ...style }}>
            <Img
                src={src}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${scale}) translate(${translate}px, ${translate}px)`,
                }}
            />
        </AbsoluteFill>
    );
};
