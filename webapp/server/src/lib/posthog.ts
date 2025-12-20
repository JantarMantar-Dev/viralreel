import { PostHog } from 'posthog-node'
import dotenv from 'dotenv'

dotenv.config()

export const posthog = new PostHog(
    'phc_Pvxpy70enymJ3fGuvqBDIkZu2G2lbIXqap2uwMHdmdl',
    { host: 'https://us.i.posthog.com' }
)

// Ensure events are flushed on exit
process.on('exit', () => posthog.shutdown())
process.on('SIGINT', () => posthog.shutdown())
process.on('SIGTERM', () => posthog.shutdown())
