
import { Composition, registerRoot } from 'remotion';
import { z } from 'zod';
// @ts-expect-error: Remotion bundler needs extensionless import, but NodeList demands .js
import { MyComposition, MyCompositionSchema } from './Composition';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="MyComp"
                component={MyComposition}
                schema={MyCompositionSchema}
                // durationInFrames will be calculated dynamically, but we need a default fallback or initial value
                durationInFrames={300}
                fps={30}
                width={1080}
                height={1920}
                calculateMetadata={async ({ props }: { props: z.infer<typeof MyCompositionSchema> }) => {
                    const fps = 30;
                    const durationInFrames = props.segments.reduce((acc: number, segment: { duration: number }) => {
                        return acc + Math.round((segment.duration || 5) * fps);
                    }, 0);
                    return {
                        durationInFrames: durationInFrames || 300, // Fallback
                        props
                    };
                }}
                defaultProps={{
                    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                    segments: [
                        {
                            image: "https://picsum.photos/id/237/1080/1920",
                            duration: 5,
                            subtitles: [
                                { text: "Hello", start: 0, end: 30 },
                                { text: "World", start: 30, end: 60 }
                            ]
                        },
                        {
                            image: "https://picsum.photos/id/238/1080/1920",
                            duration: 5,
                            subtitles: [
                                { text: "Remotion", start: 0, end: 30 },
                                { text: "Is Cool", start: 30, end: 60 }
                            ]
                        }
                    ],
                    subtitleStyle: {
                        color: 'white',
                        fontSize: 50
                    }
                }}
            />
        </>
    );
};

registerRoot(RemotionRoot);
