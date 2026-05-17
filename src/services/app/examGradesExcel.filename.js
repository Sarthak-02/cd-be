/**
 * @param {string | null | undefined} examType
 */
export function slugExamType(examType) {
    if (!examType || typeof examType !== "string") {
        return "exam";
    }
    const s = examType
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48);
    return s || "exam";
}

/**
 * @param {Date} d
 */
function formatDateForFilename(d) {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
        return "";
    }
    return d.toISOString().slice(0, 10);
}

/**
 * Base filename segment: sanitized exam name + subject exam date(s).
 * Single date: `Mid-Term-2026-05-09`. Range: `Mid-Term-2026-05-09-to-2026-05-12`.
 *
 * @param {string | null} examType
 * @param {readonly { examDate?: Date | null }[]} subjects
 */
export function buildExamGradesExcelBaseFilename(examType, subjects) {
    const namePart = slugExamType(examType);
    const dates = subjects
        .map(s => s.examDate)
        .filter(
            (d) =>
                d instanceof Date &&
                !Number.isNaN(/** @type {Date} */ (d).getTime())
        )
        .sort((a, b) => a.getTime() - b.getTime());

    let datePart = "nodate";
    if (dates.length > 0) {
        const start = dates[0];
        const end = dates[dates.length - 1];
        const sStr = formatDateForFilename(start);
        const eStr = formatDateForFilename(end);
        if (sStr && eStr) {
            datePart = sStr === eStr ? sStr : `${sStr}-to-${eStr}`;
        }
    }

    return `${namePart}-${datePart}`;
}
