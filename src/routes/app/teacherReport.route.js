import {
    teacher_report_sections_get,
    teacher_report_section_summary_get,
    teacher_report_section_grades_get,
    teacher_report_section_exam_get
} from "../../controllers/app/teacherReport.controller.js";
import {
    TeacherReportSectionsSchema,
    TeacherReportSectionSummarySchema,
    TeacherReportSectionGradesSchema,
    TeacherReportSectionExamSchema
} from "../../schemas/app/teacherReport.schema.js";

async function teacherReportRoutes(app) {
    app.get(
        "/teachers/:teacher_id/report/sections",
        { schema: { params: TeacherReportSectionsSchema.params } },
        teacher_report_sections_get
    );

    app.get(
        "/teachers/:teacher_id/report/sections/:section_id/summary",
        {
            schema: {
                params: TeacherReportSectionSummarySchema.params,
                querystring: TeacherReportSectionSummarySchema.querystring
            }
        },
        teacher_report_section_summary_get
    );

    app.get(
        "/teachers/:teacher_id/report/sections/:section_id/grades",
        {
            schema: {
                params: TeacherReportSectionGradesSchema.params,
                querystring: TeacherReportSectionGradesSchema.querystring
            }
        },
        teacher_report_section_grades_get
    );

    app.get(
        "/teachers/:teacher_id/report/sections/:section_id/exams/:exam_id",
        { schema: { params: TeacherReportSectionExamSchema.params } },
        teacher_report_section_exam_get
    );
}

export default teacherReportRoutes;
