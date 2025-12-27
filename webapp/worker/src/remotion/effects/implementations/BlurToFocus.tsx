import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { ImageEffectProps } from '../types.js';

export const BlurToFocusEffect: React.FC<ImageEffectProps> = ({ src, style, durationInFrames }) => {
    const frame = useCurrentFrame();

    // Blur from 20px to 0px
    const blur = interpolate(frame, [0, durationInFrames / 3], [20, 0], {
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
                    filter: `blur(${blur}px)`,
                }}
            />
        </AbsoluteFill>
    );
};
