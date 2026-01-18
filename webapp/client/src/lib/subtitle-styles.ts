import { CSSProperties } from 'react';

export const SUBTITLE_STYLES: Record<string, {
    name: string;
    description: string;
    previewText: string;
    style: CSSProperties;
}> = {
    "classic-capcut": {
        name: "Classic CapCut",
        description: "The viral standard",
        previewText: "EPIC",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 900,
            color: 'white',
            WebkitTextStroke: '1.6px black',
            textShadow: '0 3.2px 0 rgba(0,0,0,1)',
            textTransform: 'uppercase',
            fontSize: '6.4rem',
            letterSpacing: '-0.025em',
            lineHeight: 1
        }
    },
    "bold-impact": {
        name: "Bold Impact",
        description: "High retention",
        previewText: "WAR",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 900,
            color: '#FACC15',
            textShadow: '0 6.4px 0 rgba(0,0,0,1)',
            textTransform: 'uppercase',
            fontSize: '6.4rem',
            letterSpacing: '0'
        }
    },
    "neon-glow": {
        name: "Neon Glow",
        description: "Cyberpunk vibe",
        previewText: "LIT",
        style: {
            fontFamily: 'monospace',
            fontWeight: 700,
            color: '#22D3EE',
            textShadow: '0 0 16px rgba(34,211,238,0.8)',
            textTransform: 'uppercase',
            fontSize: '6.4rem',
            letterSpacing: '0.1em'
        }
    },
    "minimal-clean": {
        name: "Minimal Clean",
        description: "Modern aesthetic",
        previewText: "Clean",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 500,
            color: '#0F172A',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '6.4px 19.2px',
            borderRadius: '0.8rem',
            fontSize: '4rem',
            letterSpacing: '0.025em',
            textTransform: 'lowercase'
        }
    },
    "gradient-pop": {
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
            textShadow: '0 1.6px 3.2px rgba(0,0,0,0.1)',
            textTransform: 'uppercase',
            fontSize: '6.4rem',
            letterSpacing: '-0.05em'
        }
    },
    "comic-book": {
        name: "Comic Book",
        description: "Fun & Engaging",
        previewText: "POW!",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 800,
            color: 'white',
            fontSize: '6.4rem',
            letterSpacing: '0.025em',
            textTransform: 'uppercase',
            textShadow: '4.8px 4.8px 0 #000',
            transform: 'rotate(-3deg)'
        }
    },
    "typewriter": {
        name: "Typewriter",
        description: "Storytelling focus",
        previewText: "typing...",
        style: {
            fontFamily: 'monospace',
            fontWeight: 500,
            color: '#4ADE80',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '12.8px 25.6px',
            borderRadius: '0.2rem',
            fontSize: '3.6rem',
            letterSpacing: '-0.025em'
        }
    },
    "mrbeast-style": {
        name: "MrBeast Style",
        description: "Maximum attention",
        previewText: "HUGE",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 900,
            color: 'white',
            fontSize: '8rem',
            letterSpacing: '-0.05em',
            textTransform: 'uppercase',
            filter: 'drop-shadow(0 0 24px rgba(0,0,0,0.8))',
            WebkitTextStroke: '4.8px black'
        }
    },
    "karaoke": {
        name: "Karaoke",
        description: "Sing-along style",
        previewText: "Sing",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 700,
            color: '#D8B4FE',
            fontSize: '5.6rem',
            letterSpacing: '0',
            textTransform: 'capitalize',
            filter: 'drop-shadow(0 6.4px 9.6px rgba(0,0,0,0.1))'
        }
    },
    "default": {
        name: "Default",
        description: "Standard clean style",
        previewText: "Basic",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 700,
            color: 'white',
            fontSize: '4.8rem',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }
    },
    "bold-yellow": {
        name: "Bold Yellow",
        description: "High visibility style",
        previewText: "BOLD",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 900,
            color: '#FACC15',
            fontSize: '4.8rem',
            textTransform: 'uppercase',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }
    },
    "red-outline": {
        name: "Red Outline",
        description: "Distinctive outline style",
        previewText: "Outline",
        style: {
            fontFamily: 'sans-serif',
            fontWeight: 900,
            color: 'transparent',
            fontSize: '4.8rem',
            textTransform: 'uppercase',
            WebkitTextStroke: '3.2px red'
        }
    }
};
