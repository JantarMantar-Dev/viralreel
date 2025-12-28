
import { Composition, registerRoot } from 'remotion';
import { TEMPLATES } from './templates/index';
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
                        durationInFrames={template.calculateDuration(template.defaultProps as any)}
                        fps={30}
                        width={1080}
                        height={1920}
                        schema={template.schema as any}
                        defaultProps={template.defaultProps as any}
                    />
                );
            })}
        </>
    );
};

registerRoot(RemotionRoot);
