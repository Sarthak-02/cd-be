/**
 * Merge Campus.extras.class_grading_config with Exam.gradingType / Exam.gradingExtras
 * for Excel validation (download + upload).
 */

const GRADING_EXTRA_KEYS = new Set([
    "allowed_grades",
    "grade_scale",
    "grades",
    "letter_grades",
    "grade_options",
    "grade_level",
    "grade_levels",
    "grade_values",
    "levels",
    "scale",
    "values",
    "options",
    "max_marks",
    "maxMarks",
    "maximum_marks",
    "total_marks",
    "totalMarks",
    "max_grade",
    "maxGrade",
    "maximum",
    "max",
    "marks",
    "per_subject_max_marks",
    "perSubjectMaxMarks"
]);

/**
 * @param {unknown} obj
 */
function extractGradingExtrasFromObject(obj) {
    if (obj == null || typeof obj !== "object") {
        return {};
    }
    const o = /** @type {Record<string, unknown>} */ (obj);
    const out = /** @type {Record<string, unknown>} */ ({});
    for (const key of Object.keys(o)) {
        if (GRADING_EXTRA_KEYS.has(key)) {
            out[key] = o[key];
        }
        if (key === "grading_extras" || key === "gradingExtras") {
            const nested = o[key];
            if (nested != null && typeof nested === "object") {
                Object.assign(out, extractGradingExtrasFromObject(nested));
            }
        }
    }
    return out;
}

/**
 * @param {unknown} obj
 */
function extractGradingTypeFromObject(obj) {
    if (obj == null || typeof obj !== "object") {
        return null;
    }
    const o = /** @type {Record<string, unknown>} */ (obj);
    const gt = o.grading_type ?? o.gradingType;
    if (gt != null && String(gt).trim() !== "") {
        return String(gt).trim();
    }
    return null;
}

/**
 * @param {unknown} rawConfig — campus.extras.class_grading_config
 * @param {ReadonlySet<string>} classIdsInScope — from exam targets (may be empty)
 */
export function resolveCampusClassGradingConfig(rawConfig, classIdsInScope) {
    /** @type {string | null} */
    let gradingType = null;
    /** @type {Record<string, unknown>} */
    const extras = {};

    /**
     * @param {unknown} obj
     */
    function absorb(obj) {
        if (obj == null || typeof obj !== "object") {
            return;
        }
        const t = extractGradingTypeFromObject(obj);
        if (t) {
            gradingType = t;
        }
        Object.assign(extras, extractGradingExtrasFromObject(obj));
    }

    if (rawConfig == null || typeof rawConfig !== "object") {
        return { gradingType: null, gradingExtras: null };
    }

    const root = /** @type {Record<string, unknown>} */ (rawConfig);

    const hasStructuredKeys =
        "default" in root ||
        "by_class_id" in root ||
        "classes" in root ||
        "byClassId" in root;

    if (!hasStructuredKeys) {
        absorb(root);
        return {
            gradingType,
            gradingExtras:
                Object.keys(extras).length > 0 ? extras : null
        };
    }

    if (root.default != null && typeof root.default === "object") {
        absorb(root.default);
    }

    absorb(root);

    const byClass =
        root.by_class_id ?? root.classes ?? root.byClassId;
    if (
        byClass != null &&
        typeof byClass === "object" &&
        classIdsInScope.size > 0
    ) {
        const map = /** @type {Record<string, unknown>} */ (byClass);
        for (const cid of classIdsInScope) {
            const entry = map[cid];
            absorb(entry);
        }
    }

    return {
        gradingType,
        gradingExtras: Object.keys(extras).length > 0 ? extras : null
    };
}

/**
 * Campus defaults + exam overrides. Exam wins on type and on overlapping extras keys.
 *
 * @param {{ gradingType: string | null, gradingExtras: unknown }} examSlice
 * @param {unknown} campusClassGradingRaw
 * @param {ReadonlySet<string>} classIdsInScope
 */
export function buildEffectiveGradingContext(
    examSlice,
    campusClassGradingRaw,
    classIdsInScope
) {
    const campus = resolveCampusClassGradingConfig(
        campusClassGradingRaw,
        classIdsInScope
    );

    const examGt = examSlice.gradingType;
    const gradingType =
        examGt != null && String(examGt).trim() !== ""
            ? String(examGt).trim()
            : campus.gradingType;

    const ce = campus.gradingExtras;
    const ee = examSlice.gradingExtras;

    /** @type {Record<string, unknown> | null} */
    let gradingExtras = null;
    if (
        ce &&
        ee &&
        typeof ce === "object" &&
        typeof ee === "object"
    ) {
        gradingExtras = {
            .../** @type {Record<string, unknown>} */ (ce),
            .../** @type {Record<string, unknown>} */ (ee)
        };
    } else if (ee && typeof ee === "object") {
        gradingExtras = { .../** @type {Record<string, unknown>} */ (ee) };
    } else if (ce && typeof ce === "object") {
        gradingExtras = { .../** @type {Record<string, unknown>} */ (ce) };
    }

    return {
        gradingType: gradingType ?? null,
        gradingExtras
    };
}
