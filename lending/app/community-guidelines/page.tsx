import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Community Guidelines | Viral Reel",
    description: "Guidelines for creating and sharing content with Viral Reel.",
};

export default function CommunityGuidelinesPage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-500/30 relative">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[120px]" />
            </div>
            <div className="relative z-10">
                <Navbar />

                <div className="container mx-auto px-6 py-24 md:py-32 max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                        Community Guidelines
                    </h1>

                    <div className="prose prose-lg prose-slate mx-auto">
                        <p className="lead text-xl text-slate-600 mb-12 text-center">
                            Viral Reel is a tool for creativity and expression. To ensure a safe and positive environment for everyone, we ask that you follow these guidelines when using our platform.
                        </p>

                        <div className="space-y-12">
                            <section>
                                <h2 className="text-2xl font-bold mb-4 text-slate-900">1. Respect Intellectual Property</h2>
                                <p className="text-slate-600">
                                    While Viral Reel provides tools to generate content, you are responsible for ensuring that your use of the platform respects the intellectual property rights of others. Do not use our tools to reproduce copyrighted material without permission.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 text-slate-900">2. No Hate Speech or Harassment</h2>
                                <p className="text-slate-600">
                                    We have zero tolerance for content that promotes violence, discrimination, or hatred against individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, or any other characteristic.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 text-slate-900">3. Safety First</h2>
                                <p className="text-slate-600">
                                    Do not generate content that encourages dangerous behavior, self-harm, or illegal activities. Our AI safeguards are in place to prevent this, but attempting to bypass them is a violation of our terms.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 text-slate-900">4. Misinformation</h2>
                                <p className="text-slate-600">
                                    Do not use Viral Reel to create or spread false or misleading information, especially regarding public interest topics like health, elections, or civic processes.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 text-slate-900">5. Platform Manipulation</h2>
                                <p className="text-slate-600">
                                    Do not use our services to spam, manipulate engagement metrics, or deceive algorithms on social media platforms. We support organic growth through high-quality content.
                                </p>
                            </section>
                        </div>

                        <div className="mt-12 p-6 bg-slate-100 rounded-xl text-center">
                            <p className="text-slate-600 mb-4">
                                Violating these guidelines may result in the suspension or termination of your account.
                            </p>
                            <p className="text-slate-600">
                                If you see content that violates these guidelines, please contact us at <a href="mailto:support@getviralreel.com" className="text-purple-600 hover:text-purple-700 font-semibold">support@getviralreel.com</a>.
                            </p>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </main>
    );
}
