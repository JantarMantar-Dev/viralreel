import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, random } from 'remotion';
import { ImageEffectProps } from '../types.js';

export const GlitchEffect: React.FC<ImageEffectProps> = ({ src, style, durationInFrames }) => {
    const frame = useCurrentFrame();

    // Only glitch occasionally
    const isGlitchFrame = frame % 10 < 3 && frame % 30 < 10;

    const xOffset = isGlitchFrame ? (random(frame) * 20 - 10) : 0;
    const yOffset = isGlitchFrame ? (random(frame + 1) * 20 - 10) : 0;

    const rOffset = isGlitchFrame ? (random(frame + 2) * 10 - 5) : 0;
    const bOffset = isGlitchFrame ? (random(frame + 3) * 10 - 5) : 0;

    return (
        <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: 'black', ...style }}>
            {/* Red Channel */}
            <AbsoluteFill style={{
                transform: `translate(${xOffset + rOffset}px, ${yOffset}px)`,
                mixBlendMode: 'screen',
                opacity: isGlitchFrame ? 0.8 : 1
            }}>
                <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(1) saturate(500%) hue-rotate(-50deg)' }} />
            </AbsoluteFill>

            {/* Blue Channel */}
            <AbsoluteFill style={{
                transform: `translate(${xOffset - bOffset}px, ${yOffset}px)`,
                mixBlendMode: 'screen',
                opacity: isGlitchFrame ? 0.8 : 1
            }}>
                <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(1) saturate(500%) hue-rotate(180deg)' }} />
            </AbsoluteFill>

            {/* Main Image - Normal */}
            {!isGlitchFrame && (
                <AbsoluteFill>
                    <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </AbsoluteFill>
            )}
        </AbsoluteFill>
    );
};
