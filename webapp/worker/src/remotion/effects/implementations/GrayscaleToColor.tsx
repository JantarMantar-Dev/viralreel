import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { ImageEffectProps } from '../types.js';

export const GrayscaleToColorEffect: React.FC<ImageEffectProps> = ({ src, style, durationInFrames }) => {
    const frame = useCurrentFrame();

    // Grayscale from 100% to 0%
    const grayscale = interpolate(frame, [0, durationInFrames / 2], [100, 0], {
        extrapolateRight: 'clamp',
    });

    return (
        <AbsoluteFill style={{ overflow: 'hidden', ...style }}>
            <Img
                src={src}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: `grayscale(${grayscale}%)`,
                }}
            />
        </AbsoluteFill>
    );
};
