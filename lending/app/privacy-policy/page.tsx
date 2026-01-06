import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Server, RefreshCw, Mail, Globe } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Read our Privacy Policy to understand how ViralReel collects, uses, and protects your data.",
};

export default function PrivacyPolicy() {
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
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                        Privacy Policy
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                        Protecting your privacy and securing your data are our highest priorities.
                        Discover the robust measures we take to safeguard your information.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-slate-600">
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100">
                            <Lock className="w-4 h-4" /> End-to-End Encryption
                        </span>
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100">
                            <Server className="w-4 h-4" /> No Data Storage
                        </span>
                    </div>
                </div>

                {/* Quick Summary Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-16">
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Security First</h3>
                        <p className="text-slate-500">End-to-end encryption & secure processing</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                            <Server className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Storage</h3>
                        <p className="text-slate-500">Content processed in memory, never stored</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                            <Eye className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Full Control</h3>
                        <p className="text-slate-500">Revoke access anytime</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                            <Globe className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Transparency</h3>
                        <p className="text-slate-500">Clear data handling policies</p>
                    </div>
                </div>

                {/* Content */}
                <div className="prose prose-slate max-w-none hover:prose-a:text-blue-600">
                    <p className="text-sm text-slate-400 mb-8">Last Updated: December 11, 2025</p>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            📝 Introduction
                        </h2>
                        <p className="text-slate-600">
                            At Viral Reel, we prioritize the security and privacy of your data. This Privacy Policy explains how we collect, process, and protect your information. By using Viral Reel ("we," "us," "our," or "the Service"), you agree to the practices described below.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            🔐 Authentication & Security
                        </h2>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Google OAuth Integration</h3>
                        <p className="text-slate-600 mb-4">
                            We use Google's OAuth 2.0 for authentication, which means:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600">
                            <li>You authenticate directly via email or OAuth providers (e.g., Google, Microsoft, LinkedIn).</li>
                            <li>We never see or store your OAuth password.</li>
                            <li>We only request the minimum permissions needed.</li>
                            <li>You can revoke access at any time via your account settings or the connected provider.</li>
                            <li>All communication is encrypted using TLS 1.3.</li>
                            <li>Strict access controls and regular security audits are in place.</li>
                            <li>Your data is never used for advertising or profiling.</li>
                            <li>Google user data is never transferred to third-party AI tools for developing, improving, or training generalized or personalized AI/ML models.</li>
                            <li>Google Workspace APIs are not used to develop, improve, or train any generalized AI and/or ML models and never transferred to third-party AI tools for such purposes.</li>
                        </ul>
                        <div className="mt-4">
                            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-medium text-blue-600 hover:text-blue-700">
                                Manage Google Permissions -&gt;
                            </a>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            📊 Information We Collect
                        </h2>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Information You Provide Directly</h3>
                            <ul className="list-disc pl-5 space-y-2 text-slate-600">
                                <li>Name, email address, and password (hashed/encrypted) for account creation and authentication.</li>
                                <li>Contact details and content if you reach out for support.</li>
                                <li>Payment information (handled securely by third-party payment processors such as Stripe; we never store card details).</li>
                                <li>The brand names, keywords, and settings you choose to monitor.</li>
                            </ul>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Information We Collect Automatically</h3>
                            <ul className="list-disc pl-5 space-y-2 text-slate-600">
                                <li>Device data: IP address, browser, OS, device type, identifiers.</li>
                                <li>Usage data: pages viewed, actions taken, session duration, referrer URLs.</li>
                                <li>Essential cookies for session management and security.</li>
                            </ul>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Information from Third Parties</h3>
                            <ul className="list-disc pl-5 space-y-2 text-slate-600">
                                <li>API integrations: If you connect APIs (like OpenAI), we access only what's necessary for your monitoring tasks.</li>
                                <li>API keys are not stored after the session unless you enable persistent monitoring.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            🛡️ Data Protection
                        </h2>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600">
                            <li>End-to-end encryption for all data in transit using TLS 1.3</li>
                            <li>All monitoring data and AI/LLM results are processed in memory—never stored long-term unless you explicitly enable persistent history.</li>
                            <li>Role-based access controls for all support and backend actions.</li>
                            <li>Secure hosting infrastructure with regular vulnerability assessments and SOC 2/ISO 27001 compliance.</li>
                        </ul>
                    </section>


                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            ⏳ Data Retention & Deletion
                        </h2>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Our Data Retention Policy</h3>
                            <p className="text-slate-600 mb-2">Viral Reel follows a strict data minimization principle:</p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-600">
                                <li>Account data is kept as long as your account is active.</li>
                                <li>Monitoring data is processed in memory and deleted after session unless you enable history.</li>
                                <li>Authentication tokens expire on logout or after 7 days of inactivity.</li>
                                <li>Legal retention: Some info may be kept as required by law or for fraud prevention.</li>
                            </ul>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Data Deletion</h3>
                            <ul className="list-disc pl-5 space-y-2 text-slate-600">
                                <li>You can delete your account or monitoring history at any time via your dashboard or by contacting <a href="mailto:hello@getviralreel.com" className="text-blue-600 hover:text-blue-700">hello@getviralreel.com</a>.</li>
                                <li>We process deletion requests promptly and permanently remove data unless required to keep for compliance.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            🤝 Data Sharing & Third-Party Access
                        </h2>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Third-Party Data Sharing</h3>
                            <ul className="list-disc pl-5 space-y-2 text-slate-600">
                                <li><strong>No Third-Party Data Sharing:</strong> We do not share, sell, or rent your data to third parties for advertising or marketing.</li>
                                <li><strong>Service Providers:</strong> Trusted vendors (hosting, payment, infrastructure) may access your data only as needed for operations, and are bound by confidentiality agreements.</li>
                                <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, your data may transfer to the new owner, but will remain protected under this policy.</li>
                                <li><strong>Legal Compliance:</strong> Data may be disclosed as required by law, court order, or to protect rights and safety.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            🔑 How to Revoke Access
                        </h2>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Revoking Viral Reel's Access to Your Google Account</h3>
                        <p className="text-slate-600 mb-3">You may revoke access to your account or any connected service at any time:</p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                            <li>Via your Viral Reel dashboard</li>
                            <li>Via your OAuth provider’s security settings (Google, Microsoft, etc.)</li>
                            <li>By emailing <a href="mailto:hello@getviralreel.com" className="text-blue-600 hover:text-blue-700">hello@getviralreel.com</a></li>
                        </ul>
                        <p className="text-sm bg-slate-100 p-3 rounded-lg text-slate-600 border border-slate-200">
                            Note: All linked data is deleted promptly on revocation.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            ✅ Compliance & Policies
                        </h2>
                        <p className="text-slate-600 mb-4">Your Rights (Depending on Your Region):</p>
                        <div className="grid sm:grid-cols-2 gap-4 mb-6">
                            {[
                                { label: "Access", desc: "Request a copy of your data." },
                                { label: "Correction", desc: "Update or fix your data." },
                                { label: "Deletion", desc: "Delete your account/data at any time." },
                                { label: "Restriction", desc: "Limit processing of your data." },
                                { label: "Portability", desc: "Request export of your data." },
                                { label: "Withdraw Consent", desc: "Revoke permission for processing." },
                            ].map((item, i) => (
                                <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <span className="font-semibold text-slate-900 block">{item.label}</span>
                                    <span className="text-slate-500 text-sm">{item.desc}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-slate-600">
                            Contact <a href="mailto:hello@getviralreel.com" className="text-blue-600 hover:text-blue-700">hello@getviralreel.com</a> to exercise any of your rights.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            🌍 International Data Transfers
                        </h2>
                        <p className="text-slate-600">
                            Your data may be processed outside your country. We use standard contractual clauses and other safeguards to ensure your rights are protected.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            🧒 Children's Privacy
                        </h2>
                        <p className="text-slate-600">
                            Viral Reel is not intended for children under 16. We do not knowingly collect data from minors. If you believe a child has submitted data, contact us at <a href="mailto:hello@getviralreel.com" className="text-blue-600 hover:text-blue-700">hello@getviralreel.com</a> for prompt deletion.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            🍪 Cookie Policy
                        </h2>
                        <p className="text-slate-600 mb-3">We use essential cookies only:</p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                            <li><strong>Authentication Cookie:</strong> Keeps you securely logged in (session only).</li>
                            <li><strong>CSRF Token:</strong> Protects against cross-site request forgery.</li>
                            <li>No tracking or analytics cookies are used.</li>
                        </ul>
                        <p className="text-slate-600">
                            Your browsing is your business—no ad tracking or behavioral profiling.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            🔄 Changes to This Privacy Policy
                        </h2>
                        <p className="text-slate-600">
                            We may update this Privacy Policy from time to time. If there are significant changes, we will notify users via email or a prominent notice on the site. The most current version is always posted here.
                        </p>
                    </section>

                    <section className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
                            📫 Contact Us
                        </h2>
                        <p className="text-slate-600 mb-6">
                            If you have any questions, requests, or concerns about your privacy, reach out at:
                            <br />
                            <a href="mailto:hello@getviralreel.com" className="text-xl font-medium text-blue-600 hover:text-blue-700 mt-2 block">
                                hello@getviralreel.com
                            </a>
                        </p>
                        <p className="text-sm text-slate-500">
                            For more details, please review our <Link href="/terms-of-use" className="text-blue-600 hover:underline">Terms of use</Link>.
                        </p>
                    </section>

                </div>
            </div>

            {/* Simple Footer for this page */}
            <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-100">
                <p>© {new Date().getFullYear()} Viral Reel. All rights reserved.</p>
            </footer>
        </main>
    );
}
