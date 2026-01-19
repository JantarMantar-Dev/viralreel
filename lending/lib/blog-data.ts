export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    author: string;
    readTime: string;
    coverImage: string;
    tags: string[];
}

export const blogPosts: BlogPost[] = [
    {
        id: '3',
        slug: 'how-to-start-faceless-youtube-channel',
        title: 'How to Start a Faceless YouTube Channel in 2025 (Step-by-Step)',
        excerpt: 'No camera. No editing skills. No excuses. Learn exactly how to launch, grow, and monetize a faceless YouTube channel from scratch with this complete 7-step guide.',
        date: 'January 19, 2025',
        author: 'ViralReel Team',
        readTime: '12 min read',
        coverImage: '/blog/start-faceless-channel.jpg',
        tags: ['Faceless Content', 'YouTube', 'Tutorial', 'Content Creation', 'Monetization']
    },
    {
        id: '2',
        slug: 'what-is-faceless-content',
        title: 'What is Faceless Content? The Complete Guide for 2025',
        excerpt: 'Build a content empire without ever showing your face. Learn what faceless content is, why it\'s exploding in 2025, and how to create viral faceless videos with AI.',
        date: 'January 18, 2025',
        author: 'ViralReel Team',
        readTime: '15 min read',
        coverImage: '/blog/faceless-content-guide.jpg',
        tags: ['Faceless Content', 'YouTube', 'AI Video', 'Content Creation', 'Guide']
    },
    {
        id: '1',
        slug: 'launch-of-getviralreel-ai-video-creator',
        title: 'Launch of GetViralReel.com: Revolutionizing AI Video Creation',
        excerpt: 'Say goodbye to hours of video editing. viralreel uses advanced AI to turn your ideas into viral-worthy shorts in minutes.',
        date: 'December 30, 2024',
        author: 'ViralReel Team',
        readTime: '4 min read',
        coverImage: '/blog/launch-cover.jpg',
        tags: ['AI', 'Video Creation', 'Launch', 'ViralReel']
    }
];

export function getPostBySlug(slug: string): BlogPost | undefined {
    return blogPosts.find((post) => post.slug === slug);
}

export function getAllPosts(): BlogPost[] {
    return blogPosts;
}
