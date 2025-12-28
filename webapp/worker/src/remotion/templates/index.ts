
import { SimpleComposition, SimpleCompositionSchema } from './Simple/Composition.js';
import { z } from 'zod';

export const TEMPLATES = {
    'simple': {
        component: SimpleComposition,
        schema: SimpleCompositionSchema,
        defaultProps: {
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            segments: [
                {
                    imageAssetPath: "https://picsum.photos/id/237/1080/1920",
                    duration: 5,
                },
                {
                    imageAssetPath: "https://picsum.photos/id/238/1080/1920",
                    duration: 5,
                }
            ],
            subtitles: [
                { text: "Hello", start: 0, end: 30 },
                { text: "World", start: 30, end: 60 },
                { text: "Remotion", start: 150, end: 180 },
                { text: "Is Cool", start: 180, end: 210 }
            ],
            subtitleStyle: {
                color: 'white',
                fontSize: 50
            }
        },
        calculateDuration: (props: z.infer<typeof SimpleCompositionSchema>) => {
            const fps = 30;
            const durationInFrames = props.segments.reduce((acc: number, segment: { duration: number }) => {
                return acc + Math.round((segment.duration || 5) * fps);
            }, 0);
            return durationInFrames || 300;
        }
    }
} as const;

export type TemplateId = keyof typeof TEMPLATES;
