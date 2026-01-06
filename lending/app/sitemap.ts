import { MetadataRoute } from 'next';
import { getAllPosts } from '../lib/blog-data';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_LENDING_URL || 'https://getviralreel.com';

    // Blog posts
    const posts = getAllPosts();
    const blogUrls = posts.map((post) => {
        // Try to parse the date, fallback to current date if parsing fails
        let lastMod = new Date();
        try {
            const parsedDate = new Date(post.date);
            if (!isNaN(parsedDate.getTime())) {
                lastMod = parsedDate;
            }
        } catch (e) {
            console.error(`Failed to parse date for post: ${post.slug}`, e);
        }

        return {
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: lastMod,
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        };
    });

    // Static routes
    const routes = [
        { path: '', priority: 1.0, changeFrequency: 'daily' as const },
        { path: '/blog', priority: 0.9, changeFrequency: 'daily' as const },
        { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' as const },
        { path: '/terms-of-use', priority: 0.3, changeFrequency: 'yearly' as const },
    ].map((route) => ({
        url: `${baseUrl}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));

    return [...routes, ...blogUrls];
}
