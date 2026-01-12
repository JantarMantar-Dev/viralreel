import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

    // Construct CSP header
    // Removed 'unsafe-inline' and 'unsafe-eval' from script-src
    // Added 'nonce-${nonce}' to script-src
    // Keeping 'unsafe-inline' for style-src as it is often needed for injected styles (Next.js, Tailwind, etc.) 
    // until we can verify strict nonce usage for styles.
    const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' *.youtube.com *.google.com *.googleapis.com *.gstatic.com https://*.posthog.com;
    style-src 'self' 'unsafe-inline' *.googleapis.com;
    img-src 'self' blob: data: *.googleapis.com *.gstatic.com *.ytimg.com https://*.wasabisys.com;
    font-src 'self' data: *.gstatic.com;
    connect-src 'self' *.googleapis.com https://*.posthog.com https://*.getviralreel.com https://*.wasabisys.com;
    frame-src 'self' *.youtube.com;
    media-src 'self' https://*.wasabisys.com;
  `
        .replace(/\s{2,}/g, " ")
        .trim();

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", cspHeader);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    response.headers.set("Content-Security-Policy", cspHeader);

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        {
            source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
            missing: [
                { type: "header", key: "next-router-prefetch" },
                { type: "header", key: "purpose", value: "prefetch" },
            ],
        },
    ],
};
