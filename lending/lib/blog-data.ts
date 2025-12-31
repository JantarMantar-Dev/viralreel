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
