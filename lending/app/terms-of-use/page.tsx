import Link from "next/link";
import { ArrowLeft, Scale, Shield, User, Lightbulb, AlertTriangle, Gavel, Mail } from "lucide-react";

export default function TermsOfUse() {
    return (
        <main className="min-h-screen bg-white">
            {/* Header / Nav */}
            <nav className="border-b border-slate-200 bg-white/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-1.5">
                            <img src="/logo.svg" alt="Viral Reel Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-lg font-bold tracking-tighter text-slate-900">Viral Reel</span>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-6 py-12 md:py-20 max-w-4xl">
                {/* Hero Section */}
                <div className="text-center mb-16 space-y-6">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-50 text-blue-600 mb-4">
                        <Scale className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                        Terms of Use
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                        Kindly ensure you read and understand these terms before using Viral Reel.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-slate-600">
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100">
                            <Scale className="w-4 h-4" /> Fair Use
                        </span>
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100">
                            <Shield className="w-4 h-4" /> Data Protection
                        </span>
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100">
                            <User className="w-4 h-4" /> User Rights
                        </span>
                    </div>
                </div>

                {/* Quick Summary Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-16">
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                            <User className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Account Terms</h3>
                        <p className="text-slate-500">Guidelines for account creation and maintenance</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">User Obligations</h3>
                        <p className="text-slate-500">Your responsibilities while using our service</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                            <Scale className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Fair Usage</h3>
                        <p className="text-slate-500">Rules and limits for service usage</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                            <Lightbulb className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Intellectual Property</h3>
                        <p className="text-slate-500">Rights and ownership of content</p>
                    </div>
                </div>

                {/* Content */}
                <div className="prose prose-slate max-w-none hover:prose-a:text-blue-600">
                    <p className="text-sm text-slate-400 mb-8">Last Updated: December 11, 2025</p>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            📝 Agreement to Terms
                        </h2>
                        <p className="text-slate-600">
                            By accessing or using Viral Reel, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing Viral Reel.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            👤 Account Terms
                        </h2>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600">
                            <li>You must be at least 18 years old (or the legal age in your country) to use Viral Reel.</li>
                            <li>To access most features, you must register for an account using accurate, up-to-date information.</li>
                            <li>You are responsible for maintaining the security and confidentiality of your account and password.</li>
                            <li>If you become aware of any unauthorized access or security breach, notify us immediately.</li>
                            <li>We may suspend or close your account if you violate these Terms or if we detect suspicious or abusive activity.</li>
                            <li>You may close your account at any time from your dashboard or by emailing <a href="mailto:hello@getviralreel.com" className="text-blue-600 hover:text-blue-700">hello@getviralreel.com</a>.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            🤝 User Obligations
                        </h2>
                        <p className="text-slate-600 mb-3">While using Viral Reel, you agree to:</p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600">
                            <li>Use the service only for lawful purposes and in compliance with all applicable laws.</li>
                            <li>Not attempt to access data or areas of the service you are not authorized to use.</li>
                            <li>Not disrupt, overload, hack, or otherwise harm Viral Reel or its users.</li>
                            <li>Not use Viral Reel for spam, scams, or any form of abuse.</li>
                            <li>Provide feedback, ideas, or suggestions knowing that we may use them freely without obligation to you.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            ⚖️ Service Usage
                        </h2>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Fair Usage Policy</h3>
                        <p className="text-slate-600 mb-3">While using Viral Reel, you agree to:</p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                            <li>Use Viral Reel within reasonable and intended limits.</li>
                            <li>Do not attempt to bypass or circumvent any usage or technical limits we put in place.</li>
                            <li>Do not interfere with the proper operation or security of the service.</li>
                            <li>Do not attempt to gain unauthorized access to any part of Viral Reel or its systems.</li>
                            <li>If you use paid features, you will be billed according to your chosen plan. Subscriptions auto-renew unless cancelled before the next billing cycle.</li>
                            <li>Payments are handled by third-party processors; we do not store your payment data. All sales are non-refundable unless required by law.</li>
                        </ul>
                    </section>


                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            💡 Intellectual Property
                        </h2>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600">
                            <li>All software, design, content, branding, and technology on Viral Reel (except user-submitted content) is owned by us or our licensors and protected by copyright, trademark, and other laws.</li>
                            <li>You may not copy, redistribute, modify, or create derivative works from our Service except as intended by your use of Viral Reel.</li>
                            <li>You retain ownership of content you upload or generate. You grant us permission to use, display, and process this content only as needed to deliver the service.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            🔗 Third-Party Services
                        </h2>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600">
                            <li>Viral Reel may integrate with or link to third-party services and APIs (e.g., OpenAI, Google).</li>
                            <li>We do not control or endorse third-party content or policies. Use these services at your own risk and comply with their terms.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            🛡️ Data Protection & Privacy
                        </h2>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600">
                            <li>Your privacy is important. See our <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link> for how we handle your data.</li>
                            <li>We use industry-standard encryption and access controls, but cannot guarantee absolute security.</li>
                            <li>By using Viral Reel, you consent to necessary processing, storage, and transfer of your data for service delivery.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            🚫 Termination
                        </h2>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600">
                            <li>We may suspend or terminate your access to Viral Reel at our discretion, with or without notice, for any reason, including violation of these Terms.</li>
                            <li>Upon termination, your right to use the service ends immediately. You may close your account at any time by contacting <a href="mailto:hello@getviralreel.com" className="text-blue-600 hover:text-blue-700">hello@getviralreel.com</a>.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            ⚠️ Limitation of Liability
                        </h2>
                        <p className="text-slate-600 mb-2">To the maximum extent allowed by law, Viral Reel and its team are not liable for any indirect, incidental, special, or consequential damages, loss of profits, data, or goodwill resulting from:</p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                            <li>Your access to or use of (or inability to access or use) the service</li>
                            <li>Any conduct or content of any third party on the service</li>
                            <li>Any content obtained from the service</li>
                            <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                            <li>Service interruptions, changes, or discontinuation</li>
                        </ul>
                        <p className="text-slate-600">
                            If we are found liable for any reason, our total liability will not exceed the greater of $100 or the amount you paid in the last 12 months.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            🚨 Disclaimers
                        </h2>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600">
                            <li>Viral Reel is provided "as is" and "as available" without warranties of any kind, either express or implied.</li>
                            <li>We do not guarantee that the service will always be safe, error-free, secure, or uninterrupted.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            ⚖️ Governing Law
                        </h2>
                        <p className="text-slate-600">
                            These Terms are governed by the laws of the United Arab Emirates, unless otherwise required by local consumer laws in your country.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            🛠️ Changes to Terms
                        </h2>
                        <p className="text-slate-600">
                            We may update these Terms from time to time. If changes are significant, we will notify you via email or site notice. By continuing to use the service after updates, you accept the new Terms.
                        </p>
                    </section>

                    <section className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
                            📨 Contact
                        </h2>
                        <p className="text-slate-600 mb-6">
                            If you have any questions about these Terms, email us at:
                            <br />
                            <a href="mailto:hello@getviralreel.com" className="text-xl font-medium text-blue-600 hover:text-blue-700 mt-2 block">
                                hello@getviralreel.com
                            </a>
                        </p>
                        <p className="text-sm text-slate-500">
                            Thank you for using Viral Reel.
                        </p>
                    </section>

                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-100">
                <p>© {new Date().getFullYear()} Viral Reel. All rights reserved.</p>
            </footer>
        </main>
    );
}
