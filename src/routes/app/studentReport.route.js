import {
    student_report_grades_get,
    student_report_exam_get,
    student_report_subjects_get,
    student_report_summary_get
} from "../../controllers/app/studentReport.controller.js";
import {
    StudentReportGradesSchema,
    StudentReportExamSchema,
    StudentReportSubjectsSchema,
    StudentReportSummarySchema
} from "../../schemas/app/studentReport.schema.js";

const studentReportGradesOpts = {
    schema: {
        params: StudentReportGradesSchema.params,
        querystring: StudentReportGradesSchema.querystring
    }
};

const studentReportExamOpts = {
    schema: {
        params: StudentReportExamSchema.params
    }
};

const studentReportSubjectsOpts = {
    schema: {
        params: StudentReportSubjectsSchema.params,
        querystring: StudentReportSubjectsSchema.querystring
    }
};

const studentReportSummaryOpts = {
    schema: {
        params: StudentReportSummarySchema.params,
        querystring: StudentReportSummarySchema.querystring
    }
};

async function studentReportRoutes(app) {
    app.get(
        "/students/:student_id/report/summary",
        studentReportSummaryOpts,
        student_report_summary_get
    );
    app.get(
        "/students/:student_id/report/grades",
        studentReportGradesOpts,
        student_report_grades_get
    );
    app.get(
        "/students/:student_id/report/subjects",
        studentReportSubjectsOpts,
        student_report_subjects_get
    );
    app.get(
        "/students/:student_id/report/exams/:exam_id",
        studentReportExamOpts,
        student_report_exam_get
    ); 
}

export default studentReportRoutes;
