'use client'
import posthog from 'posthog-js'
import { ReactNode, useEffect } from 'react'

export function PHProvider({ children, nonce }: { children: ReactNode, nonce?: string }) {
    useEffect(() => {
        posthog.init('phc_Pvxpy70enymJ3fGuvqBDIkZu2G2lbIXqap2uwMHdmdl', {
            api_host: 'https://us.i.posthog.com',
            capture_pageview: true, // Landing page should capture pageviews
            // @ts-ignore - nonce is supported in newer versions but types might be lagging
            nonce: nonce,
        })
    }, [nonce])

    return <>{children}</>
}
