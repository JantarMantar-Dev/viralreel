"use client"

import { useState, useEffect } from "react"

export function useLendingAsset(fileName: string, fallbackUrl: string) {
    const [url, setUrl] = useState(fallbackUrl)

    useEffect(() => {
        let isMounted = true;

        const fetchSignedUrl = async () => {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
                const res = await fetch(`${apiBase}/api/public/lending-assets/${encodeURIComponent(fileName)}`);

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.url && isMounted) {
                        setUrl(data.url);
                    }
                }
            } catch (error) {
                // Silent catch, fallback is already set
                // console.warn("Failed to fetch signed URL, keeping fallback:", error);
            }
        }

        // Only fetch if fileName is provided
        if (fileName) {
            fetchSignedUrl();
        }

        return () => {
            isMounted = false;
        }
    }, [fileName, fallbackUrl]);

    return url;
}
