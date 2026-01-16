import dotenv from 'dotenv'
import attendanceRoutes from '../routes/app/attendance.route.js'
import { buildUserfacing } from './buildUserfacing.js'
import { broadcastRouter } from '../routes/app/broadcast.route.js'
import { authRouter } from '../routes/app/auth.route.js'
import studentRoutes from '../routes/app/student.route.js'


dotenv.config()


export async function buildUserfacingServer() {
    const app = await buildUserfacing()
  
    await app.register(async function (appRoutes) {
      await appRoutes.register(authRouter)
      await appRoutes.register(attendanceRoutes)
      await appRoutes.register(broadcastRouter)
      await appRoutes.register(studentRoutes)
     
    }, { prefix: '/app' })
  
    return app
  }
