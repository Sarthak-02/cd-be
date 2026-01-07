import dotenv from 'dotenv'




import { authRoutes, campusRoutes, classRoutes, schoolRoutes, sectionRoutes, studentRoutes, teacherRoutes, uploadRoutes, userRoutes } from '../routes/onboarding/index.js'
import { buildOnboarding } from './buildOnboarding.js'



dotenv.config()


export async function buildOperatorServer() {
    const app = await buildOnboarding()
  
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
