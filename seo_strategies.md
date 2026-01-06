# SEO & Quality Improvement Checklist

- [x] **1. Dynamic Metadata Optimization**
  - **Goal:** Improve click-through rates (CTR) and search relevance.
  - **Do's:**
    - Create unique, descriptive titles for every page (Home, Blog, Privacy, Terms).
    - Keep titles under 60 characters and descriptions under 160 characters.
    - Include primary keywords (e.g., "AI Video Creator", "Faceless Videos") naturally.
  - **How to Achieve:**
    - Use Next.js `generateMetadata` function in `layout.tsx` and `page.tsx`.
    - Define a template in `layout.tsx` for consistent branding (e.g., `Title | ViralReel`).
  - **Prerequisites:** None. Built-in Next.js feature.

- [x] **2. Open Graph (OG) & Twitter Cards**
  - **Goal:** Ensure beautiful, clickable previews when shared on social media.
  - **Do's:**
    - Set `og:image`, `og:title`, `og:description`, and `og:url`.
    - Use a high-quality (1200x630px) image for `og:image`.
    - Set `twitter:card` to `summary_large_image`.
  - **How to Achieve:**
    - Add `openGraph` and `twitter` objects to the `metadata` export in `layout.tsx`.
    - Place a default `opengraph-image.png` in the `app/` root or use `opengraph-image.tsx` for dynamic generation.
  - **Prerequisites:** Designed social media assets (1200x630px).

- [ ] **3. Structured Data (JSON-LD) - Organization**
  - **Goal:** Help Google understand your brand and display rich results (Knowledge Graph).
  - **Do's:**
    - Define `Organization` schema with name, logo, URL, and social profiles.
    - Use `WebSite` schema for the homepage.
  - **How to Achieve:**
    - Insert a `<script type="application/ld+json">` component in `layout.tsx` or main `page.tsx`.
    - Use a helper function to validate the JSON structure.
  - **Prerequisites:** Brand logo URL and social media profile URLs.

- [ ] **4. Structured Data (JSON-LD) - FAQ**
  - **Goal:** Win "People Also Ask" snippets in search results.
  - **Do's:**
    - Wrap your existing FAQ content in `FAQPage` schema.
    - Ensure the schema matches the visible text exactly.
  - **How to Achieve:**
    - In `components/landing/faq.tsx` (or where the FAQ data lives), map the questions to a JSON-LD object.
    - Inject it into the page head or body.
  - **Prerequisites:** Finalized FAQ content.

- [ ] **5. XML Sitemap**
  - **Goal:** Ensure search engines discover all your pages instantly.
  - **Do's:**
    - Include all public URLs (Home, Blog posts, Legal pages).
    - Exclude admin or dashboard routes.
  - **How to Achieve:**
    - Create `app/sitemap.ts`.
    - Dynamically fetch blog posts to include their URLs if applicable.
  - **Prerequisites:** List of all public routes.

- [ ] **6. Robots.txt Configuration**
  - **Goal:** Control where search engines can and cannot go.
  - **Do's:**
    - Allow access to public pages.
    - Disallow access to API routes or private user dashboards if they are on the same domain.
    - Link to your `sitemap.xml`.
  - **How to Achieve:**
    - Create `app/robots.ts`.
    - Return a `Robots` object defining `rules` and `sitemap`.
  - **Prerequisites:** URI of the sitemap.

- [ ] **7. Canonical URLs**
  - **Goal:** Prevent duplicate content issues if the site is accessed via multiple domains or query parameters.
  - **Do's:**
    - Set a self-referencing canonical tag on every page.
    - Ensure standardizing on `https` and non-www (or www).
  - **How to Achieve:**
    - Set `metadataBase` in `layout.tsx`.
    - Use `alternates: { canonical: '/' }` in the metadata object.
  - **Prerequisites:** Confirm the primary domain URL (e.g., `https://getviralreel.com`).

- [ ] **8. Semantic HTML Structure**
  - **Goal:** Improve accessibility and SEO ranking signals.
  - **Do's:**
    - Use one `<h1>` per page.
    - Use `<section>`, `<article>`, `<header>`, `<footer>` instead of just `<div>`.
    - Use logical heading hierarchy (`h1` -> `h2` -> `h3`).
  - **How to Achieve:**
    - Audit `page.tsx` and components. Replace `div` wrappers with semantic tags where appropriate.
    - Ensure the `Hero` component contains the `h1`.
  - **Prerequisites:** None. Refactoring existing code.

- [ ] **9. Image Optimization & Alt Text**
  - **Goal:** Faster load times and accessibility/Google Images ranking.
  - **Do's:**
    - Always provide descriptive `alt` text.
    - Use Next.js `<Image>` component for automatic optimization (WebP/AVIF).
    - Define explicit `width` and `height` to prevent layout shift.
  - **How to Achieve:**
    - Review `RealExamples` and `Hero` components.
    - Replace standard `<img>` tags with `import Image from 'next/image'`.
  - **Prerequisites:** Access to source images (should be in `public/` or imported).

- [ ] **10. Favicon & Web App Manifest**
  - **Goal:** Brand visibility in browser tabs, bookmarks, and mobile home screens.
  - **Do's:**
    - Provide `favicon.ico`, `icon.png`, `apple-touch-icon.png`.
    - Create a `manifest.json` (or `manifest.ts`) for PWA-like installability.
  - **How to Achieve:**
    - Place icon files in `app/` (Next.js file conventions) or `public/`.
    - Create `app/manifest.ts` to generate the manifest file.
  - **Prerequisites:** Logo assets in various sizes (192, 512, 180px).

- [ ] **11. Custom 404 Page**
  - **Goal:** Keep users on the site even if they hit a dead end.
  - **Do's:**
    - Provide a helpful message.
    - Offer links back to Home, Pricing, or Blog.
    - Maintain site branding (don't show a raw server error).
  - **How to Achieve:**
    - Create `app/not-found.tsx`.
    - Style it matching the main layout.
  - **Prerequisites:** Design/Copy for the error page.

- [ ] **12. Core Web Vitals (LCP/CLS)**
  - **Goal:** Pass Google's rigorous performance metrics.
  - **Do's:**
    - Preload the Hero image (LCP).
    - Avoid layout shifts (CLS) by reserving space for images/embeds.
    - Defer non-critical scripts.
  - **How to Achieve:**
    - Add `priority` prop to the main Hero image in `next/image`.
    - Use `next/script` with `strategy="lazyOnload"` for third-party tools (like chat widgets).
  - **Prerequisites:** Audit using PageSpeed Insights (or Chrome DevTools Lighthouse).

- [ ] **13. Mobile Responsiveness Audit**
  - **Goal:** Ensure usability on mobile (Google is mobile-first indexing).
  - **Do's:**
    - Ensure tap targets (buttons/links) are at least 44x44px.
    - Verify no horizontal scrolling issues.
    - Check font sizes are readable (min 16px for body).
  - **How to Achieve:**
    - Use Chrome DevTools Device Mode to test iPhone SE, Pixel, and iPad breakpoints.
    - Adjust Tailwind classes (e.g., `md:text-lg text-base`) as needed.
  - **Prerequisites:** None. CSS adjustments.

- [ ] **14. HTTPS & Security Headers**
  - **Goal:** Trust and security ranking signal.
  - **Do's:**
    - Enforce HTTPS.
    - Set strict Content Security Policy (CSP).
    - Set X-Frame-Options and Referrer-Policy.
  - **How to Achieve:**
    - Configure `headers` in `next.config.ts`.
  - **Prerequisites:** Knowledge of external scripts used (to allowlist in CSP).

- [ ] **15. Breadcrumb Navigation**
  - **Goal:** Help users and bots understand site hierarchy.
  - **Do's:**
    - Show a trail like `Home > Blog > Post Title` on deep pages.
    - Mark up with `BreadcrumbList` schema.
  - **How to Achieve:**
    - Create a `<Breadcrumbs />` component.
    - Add it to the `blog/[slug]/page.tsx` layout.
  - **Prerequisites:** Only relevant if there is a deeper hierarchy (like Blog).

- [ ] **16. Social Proof & Reviews Schema**
  - **Goal:** Build trust and potentially get star ratings in search.
  - **Do's:**
    - Display real user testimonials.
    - Mark them up with `Review` or `AggregateRating` schema if applicable.
  - **How to Achieve:**
    - Update `RealExamples` or a new `Testimonials` component.
    - Embed the JSON-LD schema for the product's aggregate rating.
  - **Prerequisites:** Real user reviews/ratings data.

- [ ] **17. Descriptive Anchor Text (Internal Linking)**
  - **Goal:** Pass context about linked pages to search engines.
  - **Do's:**
    - Avoid "Click here".
    - Use descriptive text like "Read our guide on AI Video Creation".
  - **How to Achieve:**
    - Review all `<Link>` components in `Footer`, `Navbar`, and body text.
    - Update text content.
  - **Prerequisites:** None. Copy update.

- [ ] **18. Analytics & Conversion Tracking**
  - **Goal:** Measure success to inform future SEO tweaks.
  - **Do's:**
    - Track page views and key events (Sign Up, View Pricing).
    - Ensure analytics script doesn't block main thread.
  - **How to Achieve:**
    - Verify `PostHogProvider` setup (already present).
    - Check if events are being captured for button clicks.
  - **Prerequisites:** Access to PostHog dashboard.

- [ ] **19. URL Structure (Slugs)**
  - **Goal:** Clean, readable URLs.
  - **Do's:**
    - Use hyphens, not underscores.
    - Keep it lowercase.
    - Avoid identifiers if possible (e.g., `/blog/seo-tips` vs `/blog/123`).
  - **How to Achieve:**
    - Verify file names in the `app` directory structure.
    - Ensure dynamic routes (`[slug]`) generate clean URLs.
  - **Prerequisites:** None.

- [ ] **20. Accessibility (a11y) Check**
  - **Goal:** Inclusive design coincides with good SEO.
  - **Do's:**
    - Ensure sufficient color contrast.
    - Use correct ARIA labels for interactive elements without text (like icon buttons).
  - **How to Achieve:**
    - Run a Lighthouse Audit in Chrome DevTools.
    - Add `aria-label` to social links in the `Footer`.
  - **Prerequisites:** None.
