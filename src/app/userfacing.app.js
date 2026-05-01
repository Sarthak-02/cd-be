import dotenv from 'dotenv'
import attendanceRoutes from '../routes/app/attendance.route.js'
import { buildUserfacing } from './buildUserfacing.js'
import { broadcastRouter } from '../routes/app/broadcast.route.js'
import { authRouter } from '../routes/app/auth.route.js'
import studentRoutes from '../routes/app/student.route.js'
import studentReportRoutes from '../routes/app/studentReport.route.js'
import teacherReportRoutes from '../routes/app/teacherReport.route.js'
import teacherRoutes from '../routes/app/teacher.route.js'
import homeworkRoutes from '../routes/app/homework.route.js'
import examRoutes from '../routes/app/exam.route.js'
import examGradeRoutes from '../routes/app/examGrade.route.js'
import deviceTokenRoutes from '../routes/app/deviceToken.route.js'
import notificationRoutes from '../routes/app/notification.route.js'
import scholarshipRoutes from '../routes/app/scholarship.route.js'
import { receiverSummaryRouter } from '../routes/app/receiverSummary.route.js'
import chatRoutes from '../routes/app/chat.route.js'
import lessonPlanRoutes from '../routes/app/lessonPlan.route.js'
import masterLessonPlanRoutes from '../routes/app/masterLessonPlan.route.js'
import classPlanRoutes from '../routes/app/classPlan.route.js'
import pickupRoutes from '../routes/app/pickup.route.js'


dotenv.config()


export async function buildUserfacingServer() {
    const app = await buildUserfacing()
  
    await app.register(async function (appRoutes) {
      await appRoutes.register(authRouter)
      await appRoutes.register(attendanceRoutes)
      await appRoutes.register(broadcastRouter)
      await appRoutes.register(studentRoutes)
      await appRoutes.register(studentReportRoutes)
      await appRoutes.register(teacherReportRoutes)
      await appRoutes.register(teacherRoutes)
      await appRoutes.register(homeworkRoutes)
      await appRoutes.register(examRoutes)
      await appRoutes.register(examGradeRoutes)
      await appRoutes.register(deviceTokenRoutes, { prefix: '/device-token' })
      await appRoutes.register(notificationRoutes)
      await appRoutes.register(scholarshipRoutes)
      await appRoutes.register(receiverSummaryRouter)
      await appRoutes.register(chatRoutes)
      await appRoutes.register(lessonPlanRoutes)
      await appRoutes.register(masterLessonPlanRoutes)
      await appRoutes.register(classPlanRoutes)
      await appRoutes.register(pickupRoutes)

    }, { prefix: '/userfacing' })
  
    return app
  }
