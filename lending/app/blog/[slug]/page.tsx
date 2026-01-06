import { getPostBySlug, blogPosts } from "@/lib/blog-data";
import { Navbar } from "@/components/landing/navbar";
import LaunchPost from "@/components/blog/posts/LaunchPost";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// Mapping of slugs to components
// In a larger app, this could be dynamic, but for now we map manually as requested
const postComponents: Record<string, React.ComponentType<any>> = {
    'launch-of-getviralreel-ai-video-creator': LaunchPost,
};

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        return {
            title: 'Post Not Found',
        };
    }

    return {
        title: `${post.title} | ViralReel Blog`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            images: [post.coverImage],
        },
    };
}

export async function generateStaticParams() {
    return blogPosts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;
    const post = getPostBySlug(slug);
    const PostComponent = postComponents[slug];

    if (!post || !PostComponent) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar hideNavLinks={true} />
            <main className="pt-24 pb-16">
                {/* 
                    We render the specific component for this post. 
                    The component itself handles its internal layout/design.
                    We could pass props if needed: <PostComponent post={post} />
                 */}
                <div className="container mx-auto px-6 max-w-4xl mb-8">
                    <Breadcrumbs
                        items={[
                            { label: 'Blog', href: '/blog' },
                            { label: post.title, href: `/blog/${slug}` }
                        ]}
                    />
                </div>
                <PostComponent />
            </main>

            {/* Simple Footer - duplicated from listing for consistency, could be a component */}
            <footer className="bg-slate-50 py-12 border-t border-slate-200 mt-20">
                <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} ViralReel. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
