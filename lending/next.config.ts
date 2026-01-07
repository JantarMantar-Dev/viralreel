import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.youtube.com *.google.com *.googleapis.com *.gstatic.com https://us-assets.i.posthog.com https://us.i.posthog.com; style-src 'self' 'unsafe-inline' *.googleapis.com; img-src 'self' blob: data: *.googleapis.com *.gstatic.com *.ytimg.com; font-src 'self' data: *.gstatic.com; connect-src 'self' *.googleapis.com https://us.i.posthog.com https://us-assets.i.posthog.com https://api.getviralreel.com; frame-src 'self' *.youtube.com; media-src 'self' https://s3.wasabisys.com/viralai-prod;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
