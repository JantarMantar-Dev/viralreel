import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { ImageEffectProps } from '../types.js';

export const CircularMorphEffect: React.FC<ImageEffectProps> = ({ src, style, durationInFrames }) => {
    const frame = useCurrentFrame();

    // Morph from circle(25%) to circle(100%)
    const radius = interpolate(frame, [0, durationInFrames], [25, 100]);

    return (
        <AbsoluteFill style={{ overflow: 'hidden', ...style }}>
            <Img
                src={src}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    clipPath: `circle(${radius}% at 50% 50%)`,
                }}
            />
        </AbsoluteFill>
    );
};
