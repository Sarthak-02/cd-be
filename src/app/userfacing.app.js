import dotenv from 'dotenv'





import { buildApp } from './buildApp.js'
import attendanceRoutes from '../routes/app/attendance.route.js'


dotenv.config()


export async function buildOperatorServer() {
    const app = await buildApp()
  
    await app.register(async function (appRoutes) {
      await appRoutes.register(attendanceRoutes)
     
    }, { prefix: '/app' })
  
    return app
  }
