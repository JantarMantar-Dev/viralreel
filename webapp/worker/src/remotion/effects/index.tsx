import { ImageEffectType, ImageEffectProps } from './types.js';
import { KenBurnsEffect } from './implementations/KenBurns.js';
import { ZoomInEffect } from './implementations/ZoomIn.js';
import { ShineEffect } from './implementations/Shine.js';
import { GrayscaleToColorEffect } from './implementations/GrayscaleToColor.js';
import { BlurToFocusEffect } from './implementations/BlurToFocus.js';
import { Tilt3DEffect } from './implementations/Tilt3D.js';
import { PanEffect } from './implementations/Pan.js';
import { CircularMorphEffect } from './implementations/CircularMorph.js';
import { GlitchEffect } from './implementations/Glitch.js';
import { CurtainEffect } from './implementations/Curtain.js';

export const IMAGE_EFFECTS: Record<ImageEffectType, React.FC<ImageEffectProps>> = {
    'ken-burns': KenBurnsEffect,
    'zoom-in': ZoomInEffect,
    'shine': ShineEffect,
    'grayscale-to-color': GrayscaleToColorEffect,
    'blur-to-focus': BlurToFocusEffect,
    'tilt-3d': Tilt3DEffect,
    'pan': PanEffect,
    'circular-morph': CircularMorphEffect,
    'glitch': GlitchEffect,
    'curtain': CurtainEffect,
};

export interface ImageWithEffectProps extends ImageEffectProps {
    effect?: ImageEffectType;
}

export const ImageWithEffect: React.FC<ImageWithEffectProps> = ({ effect, ...props }) => {
    // Default to 'ken-burns' if no effect is specified
    const EffectComponent = IMAGE_EFFECTS[effect || 'ken-burns'];

    if (!EffectComponent) {
        console.warn(`Effect '${effect}' not found, falling back to Ken Burns.`);
        const Fallback = IMAGE_EFFECTS['ken-burns'];
        return <Fallback { ...props } />;
    }

    return <EffectComponent { ...props } />;
};
