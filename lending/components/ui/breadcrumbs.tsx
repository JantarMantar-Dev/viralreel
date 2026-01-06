
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    // Generate JSON-LD Schema
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 2, // 1 is Home
            name: item.label,
            item: `${process.env.NEXT_PUBLIC_APP_URL || 'https://getviralreel.com'}${item.href}`,
        })).concat([
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${process.env.NEXT_PUBLIC_APP_URL || 'https://getviralreel.com'}/`,
            }
        ]).sort((a, b) => a.position - b.position),
    };

    return (
        <nav aria-label="Breadcrumb" className="mb-6">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ol className="flex items-center space-x-2 text-sm text-slate-500">
                <li>
                    <Link
                        href="/"
                        className="flex items-center hover:text-indigo-600 transition-colors"
                        title="Home"
                    >
                        <Home className="w-4 h-4" />
                    </Link>
                </li>
                {items.map((item, index) => (
                    <li key={item.href} className="flex items-center space-x-2">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <Link
                            href={item.href}
                            className={`hover:text-indigo-600 transition-colors ${index === items.length - 1 ? 'font-medium text-slate-900 pointer-events-none' : ''
                                }`}
                            aria-current={index === items.length - 1 ? 'page' : undefined}
                        >
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
