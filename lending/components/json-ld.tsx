import { faqs } from "../lib/faq-data";

export function OrganizationJsonLd() {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Viral Reel",
        url: "https://getviralreel.com",
        logo: "https://getviralreel.com/favicon.svg",
        sameAs: [
            "https://twitter.com/jbabatalks"
        ],
        contactPoint: {
            "@type": "ContactPoint",
            telephone: "",
            contactType: "customer service",
            email: "support@getviralreel.com"
        }
    };

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Viral Reel",
        url: "https://getviralreel.com",
        potentialAction: {
            "@type": "SearchAction",
            target: "https://getviralreel.com/?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
        </>
    );
}

export function FaqJsonLd() {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
            },
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
    );
}
