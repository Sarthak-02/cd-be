import cors from '@fastify/cors'
import dotenv from 'dotenv'
import Fastify from 'fastify'

import authHook from '../plugins/onboarding/authHook.js'
import cookiePlugin from '../plugins/common/cookie.js'
import jwtPlugin from '../plugins/common/jwt.js'
import prismaPlugin from '../plugins/common/prisma.js'

dotenv.config()
console.log(process.env.FRONTEND_URL)
export async function buildOnboarding() {
    const fastify = Fastify({ logger: true })
    
    // Register CORS FIRST before any other plugins
    await fastify.register(cors, {
        origin: (origin, cb) => {
            const allowedOrigins = [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://127.0.0.1:5173',
                'http://localhost:5000',
                'http://127.0.0.1:5000',
                process.env.FRONTEND_URL
            ].filter(Boolean) // Remove undefined/null values
            
            // Allow requests with no origin (like mobile apps, curl, Postman)
            if (!origin) return cb(null, true)
            
            if (allowedOrigins.includes(origin)) {
                cb(null, true)
            } else {
                cb(new Error('Not allowed by CORS'))
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        credentials: true,
        preflight: true,
        preflightContinue: false,
        optionsSuccessStatus: 204
    })

    // Core plugins
    await fastify.register(cookiePlugin)
    await fastify.register(jwtPlugin)

    await fastify.register(authHook)
    await fastify.register(prismaPlugin)

    return fastify
}
