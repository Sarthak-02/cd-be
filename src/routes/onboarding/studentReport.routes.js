import {
    student_report_grades_get,
    student_report_exam_get,
    student_report_subjects_get,
    student_report_summary_get
} from "../../controllers/onboarding/studentReport.controller.js";
import {
    StudentReportGradesSchema,
    StudentReportExamSchema,
    StudentReportSubjectsSchema,
    StudentReportSummarySchema
} from "../../schemas/onboarding/studentReport.schema.js";

async function studentReportRoutes(app) {
    app.get(
        "/students/:student_id/report/summary",
        { schema: { params: StudentReportSummarySchema.params, querystring: StudentReportSummarySchema.querystring, tags: StudentReportSummarySchema.tags } },
        student_report_summary_get
    );
    app.get(
        "/students/:student_id/report/grades",
        { schema: { params: StudentReportGradesSchema.params, querystring: StudentReportGradesSchema.querystring, tags: StudentReportGradesSchema.tags } },
        student_report_grades_get
    );
    app.get(
        "/students/:student_id/report/subjects",
        { schema: { params: StudentReportSubjectsSchema.params, querystring: StudentReportSubjectsSchema.querystring, tags: StudentReportSubjectsSchema.tags } },
        student_report_subjects_get
    );
    app.get(
        "/students/:student_id/report/exams/:exam_id",
        { schema: { params: StudentReportExamSchema.params, tags: StudentReportExamSchema.tags } },
        student_report_exam_get
    );
}

export default studentReportRoutes;
