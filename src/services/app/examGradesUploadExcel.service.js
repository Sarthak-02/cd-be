import ExcelJS from "exceljs";
import { prisma } from "../../prisma/prisma.js";
import { getStudentsForExam, getClassIdsForExamTargets } from "../../db/exam.db.js";
import { bulkUpsertExamGrades } from "../../db/examGrade.db.js";
import {
    resolveCellValidation,
    validateGradeCellValue
} from "./examGradesExcel.validation.js";
import { buildExamGradesExcelBaseFilename } from "./examGradesExcel.filename.js";
import { buildEffectiveGradingContext } from "./examGradesExcel.gradingContext.js";

const UPLOAD_BATCH_SIZE = 250;

/** @param {import('exceljs').Cell} cell */
function getCellText(cell) {
    if (!cell || cell.value == null || cell.value === "") {
        return "";
    }
    const txt = cell.text;
    if (txt != null && String(txt).trim() !== "") {
        return String(txt).trim();
    }
    const v = cell.value;
    if (typeof v === "number" || typeof v === "boolean") {
        return String(v);
    }
    if (typeof v === "string") {
        return v.trim();
    }
    if (typeof v === "object" && v !== null) {
        if ("richText" in v && Array.isArray(/** @type {{ richText?: { text: string }[] }} */ (v).richText)) {
            return /** @type {{ richText: { text: string }[] }} */ (v).richText
                .map(r => r.text)
                .join("")
                .trim();
        }
        if ("text" in v && (/** @type {{ text?: string }} */ (v).text != null)) {
            return String(/** @type {{ text: string }} */ (v).text).trim();
        }
        if ("result" in v && (/** @type {{ result?: unknown }} */ (v).result != null)) {
            return String(/** @type {{ result: unknown }} */ (v).result).trim();
        }
    }
    return String(v).trim();
}

/**
 * @param {string} s
 */
function normalizePersonName(s) {
    return s
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeClassSectionLabel(s) {
    return s
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * @param {{ headers: string[], dataRows: string[][], reasons: Map<number, string> }} opts
 */
async function buildErrorReportXlsx({ headers, dataRows, reasons }) {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Grades", {
        views: [{ state: "frozen", ySplit: 1 }]
    });

    const baseHeaders = headers.filter(h => !/^reason$/i.test(h));
    const outHeaders = [...baseHeaders, "Reason"];
    sheet.addRow(outHeaders);
    sheet.getRow(1).font = { bold: true };

    const failFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFC7CE" }
    };

    const expectedLen = baseHeaders.length;

    for (let i = 0; i < dataRows.length; i++) {
        const src = [...dataRows[i]];
        while (src.length < expectedLen) {
            src.push("");
        }
        const trimmed = src.slice(0, expectedLen);
        const reason = reasons.get(i) ?? "";
        const excelRow = sheet.addRow([...trimmed, reason]);

        if (reasons.has(i)) {
            excelRow.eachCell({ includeEmpty: true }, cell => {
                cell.fill = failFill;
            });
        }
    }

    sheet.columns = outHeaders.map((_, i) => ({
        width:
            i === 0
                ? 28
                : i === 1
                  ? 14
                  : i === 2
                    ? 26
                    : i === 3
                      ? 38
                      : i === outHeaders.length - 1
                        ? 44
                        : 18
    }));
    const buffer = /** @type {Buffer} */ (await wb.xlsx.writeBuffer());
    return buffer;
}

/**
 * @param {string} examId
 * @param {Buffer} fileBuffer
 * @param {{ gradedBy?: string | null }} [options]
 */
export async function processExamGradesUpload(examId, fileBuffer, options = {}) {
    const gradedBy = options.gradedBy ?? null;

    let workbook;
    try {
        workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer);
    } catch {
        return {
            ok: false,
            code: "PARSE_ERROR",
            message: "File is not a valid Excel workbook"
        };
    }

    const sheet =
        workbook.getWorksheet("Grades") ?? workbook.worksheets[0];
    if (!sheet) {
        return {
            ok: false,
            code: "PARSE_ERROR",
            message: "Workbook has no sheets"
        };
    }

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
        return { ok: false, code: "NOT_FOUND", message: "Exam not found" };
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
        return {
            ok: false,
            code: "NO_SUBJECTS",
            message: "Exam has no subjects to grade"
        };
    }

    const students = await getStudentsForExam(examId);
    if (!students) {
        return { ok: false, code: "NOT_FOUND", message: "Exam not found" };
    }

    const headerRow = sheet.getRow(1);
    const maxCol = Math.max(
        headerRow.actualCellCount || 0,
        headerRow.cellCount || 0,
        4 + subjects.length
    );

    /** @type {string[]} */
    const rawHeaders = [];
    for (let c = 1; c <= maxCol; c++) {
        rawHeaders.push(getCellText(headerRow.getCell(c)));
    }
    while (rawHeaders.length && rawHeaders[rawHeaders.length - 1] === "") {
        rawHeaders.pop();
    }
    if (rawHeaders.length > 0 && /^reason$/i.test(rawHeaders[rawHeaders.length - 1])) {
        rawHeaders.pop();
    }

    const h0 = rawHeaders[0] ?? "";
    const h1 = rawHeaders[1] ?? "";
    if (!/^student\s*name$/i.test(h0.trim())) {
        return {
            ok: false,
            code: "BAD_HEADER",
            message:
                'First column header must be "Student Name" (same as the downloaded template)'
        };
    }
    if (!/^roll\s*number$/i.test(h1.trim())) {
        return {
            ok: false,
            code: "BAD_HEADER",
            message:
                'Second column header must be "Roll Number" (same as the downloaded template)'
        };
    }

    const h2 = rawHeaders[2] ?? "";
    if (!/^class\s*\(\s*section\s*\)$/i.test(h2.trim())) {
        return {
            ok: false,
            code: "BAD_HEADER",
            message:
                'Third column header must be "Class (Section)" (same as the downloaded template)'
        };
    }

    const h3 = rawHeaders[3] ?? "";
    if (!/^student\s*id$/i.test(h3.trim())) {
        return {
            ok: false,
            code: "BAD_HEADER",
            message:
                'Fourth column header must be "Student ID" (same as the downloaded template)'
        };
    }

    /** @type {Map<number, { id: string, subjectName: string, extras: unknown }>} */
    const subjectByCol = new Map();
    const pairedSubjectIds = new Set();

    for (let c = 5; c <= rawHeaders.length; c++) {
        const label = (rawHeaders[c - 1] ?? "").trim();
        if (label === "") {
            continue;
        }
        let subj = subjects.find(s => s.subjectName === label);
        if (!subj) {
            subj = subjects.find(
                s => s.subjectName.toLowerCase() === label.toLowerCase()
            );
        }
        if (!subj) {
            return {
                ok: false,
                code: "BAD_HEADER",
                message: `Unknown subject column "${label}". Columns must match this exam's subjects.`
            };
        }
        if (pairedSubjectIds.has(subj.id)) {
            return {
                ok: false,
                code: "BAD_HEADER",
                message: `Duplicate column for subject "${subj.subjectName}"`
            };
        }
        pairedSubjectIds.add(subj.id);
        subjectByCol.set(c, subj);
    }

    if (pairedSubjectIds.size !== subjects.length) {
        const missing = subjects
            .filter(s => !pairedSubjectIds.has(s.id))
            .map(s => s.subjectName);
        return {
            ok: false,
            code: "BAD_HEADER",
            message: `Missing subject column(s): ${missing.join(", ")}`
        };
    }

    /** @type {Map<string, { student_id: string, student_name: string, student_roll_no: string | null, class_section?: string }[]>} */
    const rollGroups = new Map();
    for (const st of students) {
        const roll =
            st.student_roll_no != null ? String(st.student_roll_no).trim() : "";
        if (!roll) {
            continue;
        }
        if (!rollGroups.has(roll)) {
            rollGroups.set(roll, []);
        }
        rollGroups.get(roll)?.push(st);
    }

    /** @type {string[][]} */
    const dataRows = [];
    /** @type {Map<number, string>} */
    const reasons = new Map();

    /** @type {{ examId: string, examSubjectId: string, studentId: string, gradesObtained: string | null, remarks: null, gradedBy: string | null }[]} */
    const upserts = [];

    let lastRowNum = sheet.rowCount;
    while (lastRowNum > 1) {
        const r = sheet.getRow(lastRowNum);
        const any = [];
        for (let c = 1; c <= rawHeaders.length; c++) {
            any.push(getCellText(r.getCell(c)));
        }
        if (any.some(x => x !== "")) {
            break;
        }
        lastRowNum--;
    }

    for (let rowNum = 2; rowNum <= lastRowNum; rowNum++) {
        const row = sheet.getRow(rowNum);
        /** @type {string[]} */
        const rowVals = [];
        for (let c = 1; c <= rawHeaders.length; c++) {
            rowVals.push(getCellText(row.getCell(c)));
        }

        const nameCell = rowVals[0] ?? "";
        const rollCell = rowVals[1] ?? "";
        const classSectionCell = rowVals[2] ?? "";
        const studentIdCell = rowVals[3] ?? "";
        const rowIndex = dataRows.length;
        dataRows.push([...rowVals]);

        if (nameCell.trim() === "" && rollCell.trim() === "") {
            const nonEmptyLater = rowVals.slice(4).some(v => v !== "");
            if (!nonEmptyLater) {
                dataRows.pop();
                continue;
            }
        }

        /** @type {string[]} */
        const rowReasons = [];

        const rollKey = rollCell.trim();
        if (!rollKey) {
            rowReasons.push("Roll number is required");
        }

        /** @type {{ student_id: string, student_name: string, student_roll_no: string | null, class_section?: string } | null} */
        let student = null;

        if (rollKey) {
            const group = rollGroups.get(rollKey);
            if (!group || group.length === 0) {
                rowReasons.push(
                    "Roll number is not part of this exam (or student is inactive)"
                );
            } else {
                const uploadCsNorm =
                    normalizeClassSectionLabel(classSectionCell);

                if (group.length === 1) {
                    student = group[0];
                } else if (!uploadCsNorm) {
                    rowReasons.push(
                        "Multiple students share this roll number; enter Class (Section) to identify the correct student"
                    );
                } else {
                    const narrowed = group.filter(
                        st =>
                            normalizeClassSectionLabel(st.class_section ?? "") ===
                            uploadCsNorm
                    );
                    if (narrowed.length === 1) {
                        student = narrowed[0];
                    } else if (narrowed.length === 0) {
                        rowReasons.push(
                            `No student with this roll matches Class (Section) "${classSectionCell.trim()}"`
                        );
                    } else {
                        rowReasons.push(
                            "Multiple students still match this roll and Class (Section)"
                        );
                    }
                }
            }
        }

        if (student) {
            const rosterCsNorm = normalizeClassSectionLabel(
                student.class_section ?? ""
            );
            const uploadCsNorm =
                normalizeClassSectionLabel(classSectionCell);
            if (rosterCsNorm) {
                if (!uploadCsNorm) {
                    rowReasons.push(
                        `Class (Section) is required for this student (expected "${student.class_section}")`
                    );
                } else if (uploadCsNorm !== rosterCsNorm) {
                    rowReasons.push(
                        `Class (Section) does not match record (expected "${student.class_section}")`
                    );
                }
            }
        }

        if (student && nameCell.trim() !== "") {
            const expected = normalizePersonName(student.student_name);
            const got = normalizePersonName(nameCell);
            if (expected !== got) {
                rowReasons.push(
                    `Student name does not match records for this roll (expected "${student.student_name}")`
                );
            }
        }

        if (student && studentIdCell.trim() !== "") {
            if (studentIdCell.trim() !== student.student_id) {
                rowReasons.push(
                    `Student ID does not match record for this student (expected "${student.student_id}")`
                );
            }
        }

        subjectByCol.forEach((subj, colIdx) => {
            const rawVal = rowVals[colIdx - 1] ?? "";
            const spec = resolveCellValidation(gradingContext, subj);
            const vr = validateGradeCellValue(rawVal, spec);
            if (!vr.ok) {
                rowReasons.push(`${subj.subjectName}: ${vr.reason}`);
            }
        });

        if (rowReasons.length > 0) {
            reasons.set(rowIndex, rowReasons.join("; "));
            continue;
        }

        if (!student) {
            reasons.set(
                rowIndex,
                "Could not resolve student from roll number"
            );
            continue;
        }

        subjectByCol.forEach((subj, colIdx) => {
            const rawVal = rowVals[colIdx - 1] ?? "";
            const spec = resolveCellValidation(gradingContext, subj);
            const vr = validateGradeCellValue(rawVal, spec);
            if (vr.ok && !vr.skipped && vr.normalized != null) {
                upserts.push({
                    examId: exam.id,
                    examSubjectId: subj.id,
                    studentId: student.student_id,
                    gradesObtained: vr.normalized,
                    remarks: null,
                    gradedBy
                });
            }
        });
    }

    if (reasons.size > 0) {
        const buffer = await buildErrorReportXlsx({
            headers: rawHeaders,
            dataRows,
            reasons
        });
        const fname = `${buildExamGradesExcelBaseFilename(exam.examType, subjects)}-grades-upload-errors.xlsx`;
        return {
            ok: false,
            code: "ROW_ERRORS",
            buffer,
            filename: fname,
            errorRowCount: reasons.size,
            totalRowCount: dataRows.length
        };
    }

    for (let i = 0; i < upserts.length; i += UPLOAD_BATCH_SIZE) {
        const chunk = upserts.slice(i, i + UPLOAD_BATCH_SIZE);
        if (chunk.length > 0) {
            await bulkUpsertExamGrades(chunk);
        }
    }

    return {
        ok: true,
        grades_saved: upserts.length,
        rows_processed: dataRows.length,
        exam_id: examId
    };
}
