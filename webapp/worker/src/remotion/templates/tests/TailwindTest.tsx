import React, { CSSProperties } from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { SUBTITLE_STYLES } from '../styles';

export const TailwindTestSchema = z.object({
    subtitleTemplateId: z.string().optional(),
    previewText: z.string().optional(),
    name: z.string().optional(),
    style: z.any().optional(),
});

export const TailwindTest: React.FC<z.infer<typeof TailwindTestSchema>> = ({
    subtitleTemplateId,
    style = {},
    previewText = "TESTING",
    name = "Default Style"
}) => {
    // Explicitly merge input props
    let inputProps: any = {};
    if (typeof window !== 'undefined' && (window as any).remotion_inputProps) {
        inputProps = (window as any).remotion_inputProps;
        if (typeof inputProps === 'string') {
            try {
                inputProps = JSON.parse(inputProps);
            } catch (e) {
                console.error("Failed to parse inputProps:", e);
            }
        }
    }

    const defaultStyle: CSSProperties = {
        fontFamily: 'sans-serif',
        fontWeight: 900,
        color: 'white',
        fontSize: '4rem',
        textTransform: 'uppercase'
    };

    const finalSubtitleTemplateId = inputProps.subtitleTemplateId ?? subtitleTemplateId;
    const templateStyle = finalSubtitleTemplateId ? SUBTITLE_STYLES[finalSubtitleTemplateId]?.style || {} : {};

    const finalStyle: CSSProperties = {
        ...defaultStyle,
        ...templateStyle,
        ...(inputProps.style || style || {})
    };

    const finalPreviewText = inputProps.previewText ?? previewText;
    const finalName = inputProps.name ?? (finalSubtitleTemplateId ? SUBTITLE_STYLES[finalSubtitleTemplateId]?.name : name);

    const { width, height } = useVideoConfig();

    return (
        <AbsoluteFill style={{
            backgroundColor: '#1F2937', // bg-gray-800
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '2rem'
        }}>
            <div style={{
                color: 'white',
                fontSize: '1.5rem',
                fontFamily: 'monospace',
                marginBottom: '1rem'
            }}>
                Style: <span style={{ color: '#60A5FA' }}>{finalName}</span>
            </div>

            {/* Background checkerboard container */}
            <div style={{
                position: 'relative',
                border: '4px solid #4B5563', // gray-600
                borderRadius: '0.5rem',
                padding: '5rem',
                backgroundColor: '#374151', // gray-700
                overflow: 'hidden',
                width: width * 0.8,
                height: height * 0.4
            }}>
                {/* Centering container */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        width: '75%',
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <h1 style={{
                            ...finalStyle,
                            maxWidth: '100%',
                            textAlign: 'center',
                            wordWrap: 'break-word',
                            margin: 0
                        }}>
                            {finalPreviewText}
                        </h1>
                    </div>
                </div>
            </div>

            <div style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '1rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                color: '#9CA3AF', // gray-400
                fontFamily: 'monospace',
                maxWidth: '42rem',
                whiteSpace: 'pre-wrap'
            }}>
                {JSON.stringify(finalStyle, null, 2)}
            </div>
        </AbsoluteFill>
    );
};
