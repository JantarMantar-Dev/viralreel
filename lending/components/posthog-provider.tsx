'use client'
import posthog from 'posthog-js'
import { ReactNode, useEffect } from 'react'

export function PHProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        posthog.init('phc_Pvxpy70enymJ3fGuvqBDIkZu2G2lbIXqap2uwMHdmdl', {
            api_host: 'https://us.i.posthog.com',
            capture_pageview: true // Landing page should capture pageviews
        })
    }, [])

    return <>{children}</>
}
