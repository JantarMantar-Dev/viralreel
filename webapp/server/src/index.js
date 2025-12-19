const fastify = require('fastify')({ logger: true })
const cors = require('@fastify/cors')
require('dotenv').config()
const { auth } = require('./lib/auth')

// Register CORS
fastify.register(cors, {
    origin: ['http://localhost:5173'], // Explicit origin for credentials
    credentials: true
})

// Auth routes
fastify.all('/api/auth/*', async (request, reply) => {
    return auth.handler(request.raw, reply.raw)
})

// Health check route
fastify.get('/api/health', async (request, reply) => {
    return { status: 'ok', message: 'Fastify server is running' }
})

// Run the server
const start = async () => {
    try {
        await fastify.listen({ port: 3000 })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()
