import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing } from 'remotion';
import { ImageEffectProps } from '../types.js';

export const CurtainEffect: React.FC<ImageEffectProps> = ({ src, style, durationInFrames }) => {
    const frame = useCurrentFrame();

    // Zoom slightly
    const scale = interpolate(frame, [0, durationInFrames], [1, 1.1]);

    // Curtain slides up from bottom
    const curtainY = interpolate(frame, [durationInFrames - 30, durationInFrames], [100, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic)
    });

    return (
        <AbsoluteFill style={{ overflow: 'hidden', ...style }}>
            <Img
                src={src}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${scale})`,
                }}
            />

            {/* Curtain Overlay */}
            <AbsoluteFill
                style={{
                    background: 'rgba(0,0,0,0.7)',
                    transform: `translateY(${curtainY}%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Could add text here if we wanted to extract title from props later */}
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
