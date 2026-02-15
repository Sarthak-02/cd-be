import dotenv from 'dotenv'
import attendanceRoutes from '../routes/app/attendance.route.js'
import { buildUserfacing } from './buildUserfacing.js'
import { broadcastRouter } from '../routes/app/broadcast.route.js'
import { authRouter } from '../routes/app/auth.route.js'
import studentRoutes from '../routes/app/student.route.js'
import teacherRoutes from '../routes/app/teacher.route.js'
import homeworkRoutes from '../routes/app/homework.route.js'
import examRoutes from '../routes/app/exam.route.js'
import examGradeRoutes from '../routes/app/examGrade.route.js'
import deviceTokenRoutes from '../routes/app/deviceToken.route.js'
import notificationRoutes from '../routes/app/notification.route.js'


dotenv.config()


export async function buildUserfacingServer() {
    const app = await buildUserfacing()
  
    await app.register(async function (appRoutes) {
      await appRoutes.register(authRouter)
      await appRoutes.register(attendanceRoutes)
      await appRoutes.register(broadcastRouter)
      await appRoutes.register(studentRoutes)
      await appRoutes.register(teacherRoutes)
      await appRoutes.register(homeworkRoutes)
      await appRoutes.register(examRoutes)
      await appRoutes.register(examGradeRoutes)
      await appRoutes.register(deviceTokenRoutes, { prefix: '/device-token' })
      await appRoutes.register(notificationRoutes)
     
    }, { prefix: '/app' })
  
    return app
  }
