
import { Composition, registerRoot } from 'remotion';
import { TEMPLATES } from './templates/index.js';
import './style.css';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            {(Object.keys(TEMPLATES) as Array<keyof typeof TEMPLATES>).map((id) => {
                const template = TEMPLATES[id];
                return (
                    <Composition
                        key={String(id)}
                        id={String(id)}
                        component={template.component as any}
                        schema={template.schema as any}
                        durationInFrames={300} // Initial default
                        fps={30}
                        width={1080}
                        height={1920}
                        calculateMetadata={async ({ props }: { props: any }) => {
                            const durationInFrames = template.calculateDuration(props);
                            return {
                                durationInFrames,
                                props
                            };
                        }}
                        defaultProps={template.defaultProps as any}
                    />
                );
            })}
        </>
    );
};

registerRoot(RemotionRoot);
