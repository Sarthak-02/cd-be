import Fastify from 'fastify'
import dotenv from 'dotenv'
import cors from '@fastify/cors'

import cookiePlugin from '../plugins/cookie.js'
import jwtPlugin from '../plugins/jwt.js'
import authHook from '../plugins/authHook.js'
import prismaPlugin from '../plugins/prisma.js'



import {authRoutes ,userRoutes , schoolRoutes,campusRoutes,classRoutes,sectionRoutes,teacherRoutes, studentRoutes,uploadRoutes} from '../routes/onboarding/index.js'
import { buildApp } from './buildApp.js'


dotenv.config()


export async function buildOperatorServer() {
    const app = await buildApp()
  
    await app.register(async function (onboardingRoutes) {
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
  
    return app
  }
