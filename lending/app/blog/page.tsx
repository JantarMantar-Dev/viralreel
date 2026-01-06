import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { getAllPosts } from "@/lib/blog-data";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Blog - AI Video Creation Insights",
    description: "Latest news, tips, and insights about AI video creation, content marketing, and the future of viral shorts.",
};

export default function BlogPage() {
    const posts = getAllPosts();

    return (
        <div className="min-h-screen bg-white">
            <Navbar hideNavLinks={true} />

            <main className="pt-24 pb-16">
                {/* Header Section */}
                <section className="container mx-auto px-6 mb-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                        ViralReel Blog
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Insights, updates, and guides to help you master the art of AI-generated video content.
                    </p>
                </section>

                {/* Blog Posts Grid */}
                <section className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <article
                                key={post.id}
                                className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-purple-200 transition-all duration-300"
                            >
                                {/* Image Placeholder Removed as requested */}

                                <div className="flex-1 p-6 flex flex-col">
                                    {/* Meta Tags */}
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3 font-medium">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="size-3" />
                                            {post.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="size-3" />
                                            {post.readTime}
                                        </span>
                                    </div>

                                    <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                                        <Link href={`/blog/${post.slug}`}>
                                            {post.title}
                                        </Link>
                                    </h2>

                                    <p className="text-slate-600 mb-6 line-clamp-3 flex-1 text-sm">
                                        {post.excerpt}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                            <div className="size-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-[10px]">
                                                VR
                                            </div>
                                            {post.author}
                                        </div>
                                        <Link href={`/blog/${post.slug}`} className="text-purple-600 hover:text-purple-700 text-sm font-semibold flex items-center gap-1 group/link">
                                            Read more <ArrowRight className="size-3 transition-transform group-hover/link:translate-x-1" />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {posts.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-slate-500 text-lg">No posts yet. Stay tuned!</p>
                        </div>
                    )}
                </section>
            </main>

            {/* Simple Footer */}
            <footer className="bg-slate-50 py-12 border-t border-slate-200 mt-20">
                <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} ViralReel. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
