import Fastify from 'fastify'
import dotenv from 'dotenv'
import cors from '@fastify/cors'

import cookiePlugin from './plugins/cookie.js'
import jwtPlugin from './plugins/jwt.js'
import authHook from './plugins/authHook.js'
import prismaPlugin from './plugins/prisma.js'



import {authRoutes ,userRoutes , schoolRoutes,campusRoutes,classRoutes,sectionRoutes,teacherRoutes, studentRoutes} from './routes/onboarding/index.js'
import { uploadRoutes } from './routes/onboarding/upload.route.js'


dotenv.config()

const fastify = Fastify({ logger: true })

// Register plugins
await fastify.register(cookiePlugin)
await fastify.register(jwtPlugin)

await fastify.register(cors, {
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});


await fastify.register(authHook)
// await fastify.register(mysqlPlugin);

await fastify.register(prismaPlugin)

// // Register routes
await fastify.register(async function (onboardingRoutes) {
  await onboardingRoutes.register(authRoutes)
  await onboardingRoutes.register(userRoutes)
  await onboardingRoutes.register(schoolRoutes)
  await onboardingRoutes.register(campusRoutes)
  await onboardingRoutes.register(classRoutes)
  await onboardingRoutes.register(sectionRoutes)
  await onboardingRoutes.register(teacherRoutes)
  await onboardingRoutes.register(studentRoutes)
  await onboardingRoutes.register(uploadRoutes)
}, { prefix: '/onboarding' })

export default fastify
