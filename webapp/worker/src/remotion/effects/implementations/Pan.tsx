import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { ImageEffectProps } from '../types.js';

export const PanEffect: React.FC<ImageEffectProps> = ({ src, style, durationInFrames }) => {
    const frame = useCurrentFrame();

    // Pan from top (0%) to bottom (100%)
    const panY = interpolate(frame, [0, durationInFrames], [0, 100]);

    return (
        <AbsoluteFill style={{ overflow: 'hidden', ...style }}>
            <Img
                src={src}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: `center ${panY}%`,
                }}
            />
        </AbsoluteFill>
    );
};
