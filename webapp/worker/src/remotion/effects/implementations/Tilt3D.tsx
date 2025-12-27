import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { ImageEffectProps } from '../types.js';

export const Tilt3DEffect: React.FC<ImageEffectProps> = ({ src, style, durationInFrames }) => {
    const frame = useCurrentFrame();

    const rotateY = interpolate(frame, [0, durationInFrames], [-15, 15]);
    const rotateX = interpolate(frame, [0, durationInFrames], [5, -5]);

    return (
        <AbsoluteFill style={{
            perspective: '1000px',
            overflow: 'hidden',
            ...style
        }}>
            <div style={{
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(1.1)`, // Scale to prevent edges showing
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <Img
                    src={src}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
            </div>
        </AbsoluteFill>
    );
};
