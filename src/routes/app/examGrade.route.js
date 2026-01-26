import {
    upsert_exam_grade,
    bulk_upsert_exam_grades,
    get_grades_by_exam,
    get_grades_by_exam_subject,
    get_grades_by_student,
    get_grade_by_id,
    update_exam_grade,
    delete_exam_grade,
    delete_grades_by_exam_subject,
    get_exam_grade_statistics,
    get_student_exam_report
} from "../../controllers/app/examGrade.controller.js";

import {
    ExamGradeUpsertSchema,
    ExamGradeBulkUpsertSchema,
    ExamGradeGetByExamSchema,
    ExamGradeGetByExamSubjectSchema,
    ExamGradeGetByStudentSchema,
    ExamGradeGetByIdSchema,
    ExamGradeUpdateSchema,
    ExamGradeDeleteSchema,
    ExamGradeDeleteByExamSubjectSchema,
    ExamGradeGetStatisticsSchema,
    ExamGradeGetStudentReportSchema
} from "../../schemas/app/examGrade.schema.js";

const examGradeUpsertOpts = {
    schema: {
        body: ExamGradeUpsertSchema.body
    }
};

const examGradeBulkUpsertOpts = {
    schema: {
        body: ExamGradeBulkUpsertSchema.body
    }
};

const examGradeGetByExamOpts = {
    schema: {
        params: ExamGradeGetByExamSchema.params
    }
};

const examGradeGetByExamSubjectOpts = {
    schema: {
        params: ExamGradeGetByExamSubjectSchema.params
    }
};

const examGradeGetByStudentOpts = {
    schema: {
        querystring: ExamGradeGetByStudentSchema.querystring
    }
};

const examGradeGetByIdOpts = {
    schema: {
        params: ExamGradeGetByIdSchema.params
    }
};

const examGradeUpdateOpts = {
    schema: {
        params: ExamGradeUpdateSchema.params,
        body: ExamGradeUpdateSchema.body
    }
};

const examGradeDeleteOpts = {
    schema: {
        params: ExamGradeDeleteSchema.params
    }
};

const examGradeDeleteByExamSubjectOpts = {
    schema: {
        params: ExamGradeDeleteByExamSubjectSchema.params
    }
};

const examGradeGetStatisticsOpts = {
    schema: {
        params: ExamGradeGetStatisticsSchema.params
    }
};

const examGradeGetStudentReportOpts = {
    schema: {
        querystring: ExamGradeGetStudentReportSchema.querystring
    }
};

async function examGradeRoutes(app, options) {
    // Create/Update grades
    app.post("/exam-grade", examGradeUpsertOpts, upsert_exam_grade);
    app.post("/exam-grade/bulk", examGradeBulkUpsertOpts, bulk_upsert_exam_grades);

    // Get grades
    app.get("/exam-grade/:grade_id", examGradeGetByIdOpts, get_grade_by_id);
    app.get("/exam-grade/exam/:exam_id", examGradeGetByExamOpts, get_grades_by_exam);
    app.get("/exam-grade/subject/:exam_subject_id", examGradeGetByExamSubjectOpts, get_grades_by_exam_subject);
    app.get("/exam-grade/student/all", examGradeGetByStudentOpts, get_grades_by_student);
    app.get("/exam-grade/student/report", examGradeGetStudentReportOpts, get_student_exam_report);

    // Statistics
    app.get("/exam-grade/exam/:exam_id/statistics", examGradeGetStatisticsOpts, get_exam_grade_statistics);

    // Update grade
    app.patch("/exam-grade/:grade_id", examGradeUpdateOpts, update_exam_grade);

    // Delete grades
    app.delete("/exam-grade/:grade_id", examGradeDeleteOpts, delete_exam_grade);
    app.delete("/exam-grade/subject/:exam_subject_id/all", examGradeDeleteByExamSubjectOpts, delete_grades_by_exam_subject);
}

export default examGradeRoutes;
