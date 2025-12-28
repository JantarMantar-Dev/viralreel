import { CSSProperties } from 'react';

export const SUBTITLE_STYLES: Record<string, {
    name: string;
    description: string;
    previewText: string;
    style: CSSProperties;
}> = {
    "Classic CapCut": {
        name: "Classic CapCut",
        description: "The viral standard",
        previewText: "EPIC",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 900,
            color: 'white',
            WebkitTextStroke: '1.6px black', // 2px * 0.8
            textShadow: '0 3.2px 0 rgba(0,0,0,1)', // 4px * 0.8
            textTransform: 'uppercase',
            fontSize: '6.4rem', // 8rem * 0.8
            letterSpacing: '-0.025em',
            lineHeight: 1
        }
    },
    "Bold Impact": {
        name: "Bold Impact",
        description: "High retention",
        previewText: "WAR",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 900,
            color: '#FACC15', // text-yellow-400
            textShadow: '0 6.4px 0 rgba(0,0,0,1)', // 8px * 0.8
            textTransform: 'uppercase',
            fontSize: '6.4rem', // 8rem * 0.8
            letterSpacing: '0'
        }
    },
    "Neon Glow": {
        name: "Neon Glow",
        description: "Cyberpunk vibe",
        previewText: "LIT",
        style: {
            fontFamily: 'monospace',
            fontWeight: 700,
            color: '#22D3EE', // text-cyan-400
            textShadow: '0 0 16px rgba(34,211,238,0.8)', // 20px * 0.8
            textTransform: 'uppercase',
            fontSize: '6.4rem', // 8rem * 0.8
            letterSpacing: '0.1em'
        }
    },
    "Minimal Clean": {
        name: "Minimal Clean",
        description: "Modern aesthetic",
        previewText: "Clean",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 500,
            color: '#0F172A', // text-slate-909
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '6.4px 19.2px', // 8px * 0.8, 24px * 0.8
            borderRadius: '0.8rem', // 1rem * 0.8
            fontSize: '4rem', // 5rem * 0.8
            letterSpacing: '0.025em',
            textTransform: 'lowercase'
        }
    },
    "Gradient Pop": {
        name: "Gradient Pop",
        description: "Colorful energy",
        previewText: "VIBE",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 900,
            color: 'transparent',
            backgroundImage: 'linear-gradient(to right, #C084FC, #DB2777)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            textShadow: '0 1.6px 3.2px rgba(0,0,0,0.1)', // Scaled shadow
            textTransform: 'uppercase',
            fontSize: '6.4rem', // 8rem * 0.8
            letterSpacing: '-0.05em'
        }
    },
    "Comic Book": {
        name: "Comic Book",
        description: "Fun & Engaging",
        previewText: "POW!",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 800,
            color: 'white',
            fontSize: '6.4rem', // 8rem * 0.8
            letterSpacing: '0.025em',
            textTransform: 'uppercase',
            textShadow: '4.8px 4.8px 0 #000', // 6px * 0.8
            transform: 'rotate(-3deg)'
        }
    },
    "Typewriter": {
        name: "Typewriter",
        description: "Storytelling focus",
        previewText: "typing...",
        style: {
            fontFamily: 'monospace',
            fontWeight: 500,
            color: '#4ADE80', // text-green-400
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '12.8px 25.6px', // Scaled padding
            borderRadius: '0.2rem', // Scaled radius
            fontSize: '3.6rem', // 4.5rem * 0.8
            letterSpacing: '-0.025em'
        }
    },
    "MrBeast Style": {
        name: "MrBeast Style",
        description: "Maximum attention",
        previewText: "HUGE",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 900,
            color: 'white',
            fontSize: '8rem', // 10rem * 0.8
            letterSpacing: '-0.05em',
            textTransform: 'uppercase',
            filter: 'drop-shadow(0 0 24px rgba(0,0,0,0.8))', // 30px * 0.8
            WebkitTextStroke: '4.8px black' // 6px * 0.8
        }
    },
    "Karaoke": {
        name: "Karaoke",
        description: "Sing-along style",
        previewText: "Sing",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 700,
            color: '#D8B4FE', // text-purple-300
            fontSize: '5.6rem', // 7rem * 0.8
            letterSpacing: '0',
            textTransform: 'capitalize',
            filter: 'drop-shadow(0 6.4px 9.6px rgba(0,0,0,0.1))' // Scaled shadow
        }
    }
};
