import Fastify from 'fastify'
import dotenv from 'dotenv'
import cors from '@fastify/cors'

import cookiePlugin from './plugins/cookie.js'
import jwtPlugin from './plugins/jwt.js'
import authHook from './plugins/authHook.js'
import prismaPlugin from './plugins/prisma.js'



import {authRoutes ,userRoutes , schoolRoutes,campusRoutes,classRoutes,sectionRoutes,teacherRoutes, studentRoutes} from './routes/index.js'
import { uploadRoutes } from './routes/upload.route.js'


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
await fastify.register(authRoutes)
await fastify.register(userRoutes)
await fastify.register(schoolRoutes)
await fastify.register(campusRoutes)
await fastify.register(classRoutes)
await fastify.register(sectionRoutes)
await fastify.register(teacherRoutes)
await fastify.register(studentRoutes)
await fastify.register(uploadRoutes)

export default fastify
