import cors from '@fastify/cors'
import dotenv from 'dotenv'
import Fastify from 'fastify'

import authHook from '../plugins/app/authHook.js'
import cookiePlugin from '../plugins/common/cookie.js'
import jwtPlugin from '../plugins/common/jwt.js'
import prismaPlugin from '../plugins/common/prisma.js'

dotenv.config()

export async function buildOnboarding() {
    const fastify = Fastify({ logger: true })

    // Core plugins
    await fastify.register(cookiePlugin)
    await fastify.register(jwtPlugin)
    
    await fastify.register(cors, {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    })

    await fastify.register(authHook)
    await fastify.register(prismaPlugin)

    return fastify
}
