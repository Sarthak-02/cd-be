import ExcelJS from "exceljs";
import { prisma } from "../../prisma/prisma.js";
import { getStudentsForExam, getClassIdsForExamTargets } from "../../db/exam.db.js";
import {
    resolveCellValidation,
    columnLetter,
    listNeedsHelperSheet,
    buildInlineListFormulae
} from "./examGradesExcel.validation.js";
import { buildExamGradesExcelBaseFilename } from "./examGradesExcel.filename.js";
import { buildEffectiveGradingContext } from "./examGradesExcel.gradingContext.js";

const VALIDATION_LAST_ROW = 5000;

/**
 * Build an .xlsx grade-entry template for an exam (student rows × subject columns).
 *
 * @param {string} examId
 * @returns {Promise<{ ok: true, buffer: Buffer, filename: string } | { ok: false, code: 'NOT_FOUND' | 'NO_SUBJECTS' }>}
 */
export async function buildExamGradesTemplateXlsx(examId) {
    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        select: {
            id: true,
            examType: true,
            gradingType: true,
            gradingExtras: true,
            campusId: true,
            targets: { select: { targetType: true, targetId: true } }
        }
    });

    if (!exam) {
        return { ok: false, code: "NOT_FOUND" };
    }

    const campus = await prisma.campus.findUnique({
        where: { campus_id: exam.campusId },
        select: { extras: true }
    });

    const classIds = await getClassIdsForExamTargets(exam.targets);
    const campusExtras = campus?.extras;
    const classGradingRaw =
        campusExtras != null && typeof campusExtras === "object"
            ? /** @type {Record<string, unknown>} */ (campusExtras)
                  .class_grading_config
            : undefined;

    const gradingContext = buildEffectiveGradingContext(
        {
            gradingType: exam.gradingType,
            gradingExtras: exam.gradingExtras
        },
        classGradingRaw,
        classIds
    );

    const subjects = await prisma.examSubject.findMany({
        where: { examId },
        select: {
            id: true,
            subjectName: true,
            extras: true,
            examDate: true
        },
        orderBy: [{ examDate: "asc" }, { examStartTime: "asc" }, { id: "asc" }]
    });

    if (subjects.length === 0) {
        return { ok: false, code: "NO_SUBJECTS" };
    }

    const students = await getStudentsForExam(examId);
    if (!students) {
        return { ok: false, code: "NOT_FOUND" };
    }

    const grades = await prisma.examGrade.findMany({
        where: { examId },
        select: {
            studentId: true,
            examSubjectId: true,
            gradesObtained: true
        }
    });

    const gradeMap = new Map();
    for (const g of grades) {
        const key = `${g.studentId}\t${g.examSubjectId}`;
        gradeMap.set(key, g.gradesObtained ?? "");
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "control-desk";
    const sheet = workbook.addWorksheet("Grades", {
        views: [{ state: "frozen", ySplit: 1 }]
    });

    /** @type {import('exceljs').Worksheet | null} */
    let listsSheet = null;
    let listsNextRow = 1;
    const listRangeCache = new Map();

    /**
     * @param {string[]} values
     */
    function allocateListRange(values) {
        const cacheKey = JSON.stringify(values);
        const cached = listRangeCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        if (!listsSheet) {
            listsSheet = workbook.addWorksheet("Lists");
            listsSheet.state = "hidden";
        }
        const start = listsNextRow;
        for (const v of values) {
            listsSheet.getCell(listsNextRow, 1).value = v;
            listsNextRow += 1;
        }
        const end = listsNextRow - 1;
        const ref = `=Lists!$A$${start}:$A$${end}`;
        listRangeCache.set(cacheKey, ref);
        return ref;
    }

    sheet.columns = [
        { width: 28 },
        { width: 14 },
        { width: 26 },
        { width: 38 },
        ...subjects.map(() => ({ width: 18 }))
    ];

    sheet.addRow([
        "Student Name",
        "Roll Number",
        "Class (Section)",
        "Student ID",
        ...subjects.map(s => s.subjectName)
    ]);
    sheet.getColumn(4).numFmt = "@";
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };

    for (const st of students) {
        const displayRoll =
            st.student_roll_no != null ? String(st.student_roll_no) : "";
        const classSection = String(st.class_section ?? "");
        const marks = subjects.map(sub => {
            const key = `${st.student_id}\t${sub.id}`;
            const raw = gradeMap.get(key);
            if (raw == null || raw === "") {
                return "";
            }
            return String(raw);
        });
        sheet.addRow([
            st.student_name,
            displayRoll,
            classSection,
            st.student_id,
            ...marks
        ]);
    }

    const validations = subjects.map(sub =>
        resolveCellValidation(gradingContext, sub)
    );

    for (let i = 0; i < subjects.length; i++) {
        const col = columnLetter(5 + i);
        const range = `${col}2:${col}${VALIDATION_LAST_ROW}`;
        const spec = validations[i];

        if (spec.kind === "list") {
            let formulae;
            if (listNeedsHelperSheet(spec.values)) {
                formulae = [allocateListRange(spec.values)];
            } else {
                formulae = buildInlineListFormulae(spec.values);
            }
            sheet.dataValidations.add(range, {
                type: "list",
                allowBlank: true,
                formulae,
                showErrorMessage: true,
                errorStyle: "error",
                errorTitle: "Invalid value",
                error: "Pick a value from the list."
            });
        } else if (spec.kind === "decimal") {
            sheet.dataValidations.add(range, {
                type: "decimal",
                operator: "between",
                allowBlank: true,
                formulae: [spec.min, spec.max],
                showErrorMessage: true,
                errorStyle: "error",
                errorTitle: "Invalid marks",
                error: `Enter a number between ${spec.min} and ${spec.max}.`
            });
        }
    }

    const buffer = /** @type {Buffer} */ (await workbook.xlsx.writeBuffer());
    const fname = `${buildExamGradesExcelBaseFilename(exam.examType, subjects)}-grades-template.xlsx`;

    return { ok: true, buffer, filename: fname };
}
