import React from 'react';

export type ImageEffectType =
    | 'ken-burns'
    | 'zoom-in'
    | 'shine'
    | 'grayscale-to-color'
    | 'blur-to-focus'
    | 'tilt-3d'
    | 'pan'
    | 'circular-morph'
    | 'glitch'
    | 'curtain';

export interface ImageEffectProps {
    src: string;
    style?: React.CSSProperties;
    width?: number | string;
    height?: number | string;
    durationInFrames: number;
}
