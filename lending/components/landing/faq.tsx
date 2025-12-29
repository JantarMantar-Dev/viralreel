"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => {
    return (
        <div className="border-b border-slate-200">
            <button
                onClick={onClick}
                className="flex w-full items-center justify-between py-6 text-left focus:outline-none"
            >
                <span className="text-lg font-medium text-slate-900">{question}</span>
                <span className="ml-6 flex-shrink-0">
                    {isOpen ? (
                        <Minus className="h-5 w-5 text-purple-600" />
                    ) : (
                        <Plus className="h-5 w-5 text-slate-400" />
                    )}
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-slate-600 leading-relaxed max-w-2xl">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const faqs = [
    {
        question: "What can I generate?",
        answer: "You can generate both single videos and full video series. We support both portrait (9:16) format for TikTok/Reels/Shorts and landscape (16:9) format for traditional YouTube videos. Whether you need a quick viral clip or a comprehensive series, we've got you covered."
    },
    {
        question: "What is the video duration range?",
        answer: "You have complete control over duration. Create videos ranging from snappy 30-second clips perfect for social media engagement, all the way up to 5-minute in-depth content for more detailed storytelling."
    },
    {
        question: "Is it easy to use?",
        answer: "Yes, absolutely! We've designed the platform to be incredibly user-friendly. deeply complex AI workflows are handled under the hood. You simply provide your topic or idea, and our AI takes care of the scriptwriting, visuals, voiceover, and editing automatically."
    },
    {
        question: "Do I need to be a content expert?",
        answer: "Not at all. Our AI models act as the content expert. You just need the initial spark or idea – we handle the research, structuring, and production to create professional-quality content that looks like it was made by a pro."
    },
    {
        question: "How many videos can I generate per month?",
        answer: "We offer flexible plans to suit different needs, including options for unlimited video generation. Check out our pricing section above to find the perfect plan for your content creation goals."
    },
    {
        question: "Can I get a refund?",
        answer: "Due to the high instant costs associated with high-quality AI generation (GPU processing and premium API usage), we do not offer refunds once credits are used. However, you can cancel your subscription at any time to prevent future billing."
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-40">
                <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-purple-100/60 rounded-full blur-[100px]" />
                <div className="absolute  bottom-[20%] left-[10%] w-[300px] h-[300px] bg-blue-100/60 rounded-full blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
                        Got Questions?
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Everything you need to know about creating viral content with ViralReel.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                    {faqs.map((faq, index) => (
                        <FAQItem
                            key={index}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openIndex === index}
                            onClick={() => toggleFAQ(index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
