import { ImageEffectType, ImageEffectProps } from './types';
import { KenBurnsEffect } from './implementations/KenBurns';
import { ZoomInEffect } from './implementations/ZoomIn';
import { ShineEffect } from './implementations/Shine';
import { GrayscaleToColorEffect } from './implementations/GrayscaleToColor';
import { BlurToFocusEffect } from './implementations/BlurToFocus';
import { Tilt3DEffect } from './implementations/Tilt3D';
import { PanEffect } from './implementations/Pan';
import { CircularMorphEffect } from './implementations/CircularMorph';
import { GlitchEffect } from './implementations/Glitch';
import { CurtainEffect } from './implementations/Curtain';

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
        return <Fallback {...props} />;
    }

    return <EffectComponent {...props} />;
};
