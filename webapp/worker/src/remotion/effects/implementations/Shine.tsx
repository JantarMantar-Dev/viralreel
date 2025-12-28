import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { ImageEffectProps } from '../types.js';

export const ShineEffect: React.FC<ImageEffectProps> = ({ src, style, durationInFrames }) => {
    const frame = useCurrentFrame();

    // Shine moves from left (-100%) to right (200%)
    const shinePosition = interpolate(frame, [0, durationInFrames], [-100, 200]);

    return (
        <AbsoluteFill style={{ overflow: 'hidden', ...style }}>
            <Img
                src={src}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
            />
            {/* Shine overlay */}
            <AbsoluteFill
                style={{
                    background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)',
                    width: '50%',
                    height: '100%',
                    transform: `skewX(-25deg) translateX(${shinePosition}%)`,
                    left: 0,
                    top: 0,
                }}
            />
        </AbsoluteFill>
    );
};
