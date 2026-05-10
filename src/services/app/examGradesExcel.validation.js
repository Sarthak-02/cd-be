import { parseMaxGradePossibleFromGradingExtras } from "../../db/studentReport.db.js";

const MAX_FREE_TEXT_LEN = 512;

/**
 * @param {unknown} extras
 * @returns {string[] | null}
 */
export function parseAllowedGradesList(extras) {
    if (extras == null || typeof extras !== "object") {
        return null;
    }
    const keys = [
        "allowed_grades",
        "grade_scale",
        "grades",
        "letter_grades",
        "grade_options",
        "options"
    ];
    for (const k of keys) {
        const v = /** @type {Record<string, unknown>} */ (extras)[k];
        if (Array.isArray(v) && v.length > 0) {
            const out = v
                .map(x => String(x).trim())
                .filter(Boolean);
            if (out.length > 0) {
                return [...new Set(out)];
            }
        }
    }
    return null;
}

/**
 * @param {{ gradingType: string | null, gradingExtras: unknown }} exam
 * @param {{ extras: unknown }} subject
 * @returns {{ kind: 'list', values: string[] } | { kind: 'decimal', min: number, max: number } | { kind: 'none' }}
 */
export function resolveCellValidation(exam, subject) {
    const listFromSubject = parseAllowedGradesList(subject.extras);
    const listFromExam = parseAllowedGradesList(exam.gradingExtras);
    const list = listFromSubject ?? listFromExam;
    if (list && list.length > 0) {
        return { kind: "list", values: list };
    }

    const gt = (exam.gradingType || "").toLowerCase();
    if (gt.includes("pass/fail")) {
        return { kind: "list", values: ["Pass", "Fail"] };
    }
    if (gt.includes("pass") && gt.includes("fail")) {
        return { kind: "list", values: ["Pass", "Fail"] };
    }

    const maxSub = parseMaxGradePossibleFromGradingExtras(subject.extras);
    const maxExam = parseMaxGradePossibleFromGradingExtras(exam.gradingExtras);
    const max = maxSub ?? maxExam;

    if (max != null) {
        return { kind: "decimal", min: 0, max };
    }

    if (/\b(percent|marks|score|numeric|points)\b/i.test(exam.gradingType || "")) {
        return { kind: "decimal", min: 0, max: 100 };
    }

    return { kind: "none" };
}

/**
 * @param {number} colIndex1Based
 */
export function columnLetter(colIndex1Based) {
    let n = colIndex1Based;
    let s = "";
    while (n > 0) {
        const r = (n - 1) % 26;
        s = String.fromCharCode(65 + r) + s;
        n = Math.floor((n - 1) / 26);
    }
    return s;
}

/**
 * @param {string[]} values
 */
export function listNeedsHelperSheet(values) {
    const joined = values.join(",");
    if (joined.length > 220) {
        return true;
    }
    return values.some(v => String(v).includes(","));
}

/**
 * @param {string[]} values
 */
export function buildInlineListFormulae(values) {
    const inner = values
        .map(v => String(v).trim().replace(/"/g, '""'))
        .join(",");
    return [`"${inner}"`];
}

/**
 * @param {string | number | null | undefined} raw
 * @param {{ kind: 'list', values: string[] } | { kind: 'decimal', min: number, max: number } | { kind: 'none' }} spec
 * @returns {{ ok: true, skipped?: true, normalized?: string } | { ok: false, reason: string }}
 */
export function validateGradeCellValue(raw, spec) {
    const s =
        raw == null
            ? ""
            : typeof raw === "number"
              ? String(raw)
              : String(raw).trim();

    if (s === "") {
        return { ok: true, skipped: true };
    }

    if (spec.kind === "none") {
        if (s.length > MAX_FREE_TEXT_LEN) {
            return {
                ok: false,
                reason: `Value must be at most ${MAX_FREE_TEXT_LEN} characters`
            };
        }
        return { ok: true, normalized: s };
    }

    if (spec.kind === "list") {
        const lower = s.toLowerCase();
        const hit = spec.values.find(
            v => v.trim().toLowerCase() === lower
        );
        if (!hit) {
            return {
                ok: false,
                reason: `Must be one of: ${spec.values.join(", ")}`
            };
        }
        return { ok: true, normalized: hit };
    }

    if (spec.kind === "decimal") {
        const normalizedNum = s.replace(",", ".");
        const n = Number(normalizedNum);
        if (!Number.isFinite(n)) {
            return {
                ok: false,
                reason: `Must be a number between ${spec.min} and ${spec.max}`
            };
        }
        if (n < spec.min || n > spec.max) {
            return {
                ok: false,
                reason: `Must be between ${spec.min} and ${spec.max} (received ${n})`
            };
        }
        return { ok: true, normalized: s.trim() };
    }

    return { ok: true, normalized: s };
}
