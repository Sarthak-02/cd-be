import {
  validateLessonPlanScope,
  createLessonPlan,
  getLessonPlanById,
  listLessonPlans,
  updateLessonPlan,
  deleteLessonPlan,
  addLessonPlanAttachments,
  removeLessonPlanAttachment,
  getAttachmentLessonPlanId,
} from "../../db/lessonPlan.db.js";
import { generateDocumentUploadSignedUrl } from "../../services/gcsSignedUrl.js";

function toDbPayload(body) {
  return {
    lessonDate: body.lesson_date,
    chapterTopic: body.chapter_topic,
    learningObjectives: body.learning_objectives,
    activities: body.activities,
    homework: body.homework,
    status: body.status ?? "PLANNED",
    subjectId: body.subject_id,
    classId: body.class_id,
    sectionId: body.section_id,
    teacherId: body.teacher_id,
    attachments: body.attachments,
  };
}

export async function create_lesson_plan(req, reply) {
  try {
    const body = req.body;
    const {
      lesson_date,
      chapter_topic,
      learning_objectives,
      activities,
      subject_id,
      class_id,
      teacher_id,
    } = body;

    if (
      !lesson_date ||
      !chapter_topic ||
      !learning_objectives?.length ||
      activities === undefined
    ) {
      return reply.code(400).send({
        success: false,
        message:
          "lesson_date, chapter_topic, non-empty learning_objectives, and activities are required",
      });
    }

    const scope = await validateLessonPlanScope({
      teacherId: teacher_id,
      subjectId: subject_id,
      classId: class_id,
      sectionId: body.section_id ?? null,
    });

    if (!scope.ok) {
      return reply.code(400).send({ success: false, message: scope.message });
    }

    const plan = await createLessonPlan({
      ...toDbPayload(body),
      campusId: scope.campusId,
      attachments: body.attachments ?? [],
    });

    if (!plan) {
      return reply.code(500).send({
        success: false,
        message: "Failed to create lesson plan",
      });
    }

    reply.send({
      success: true,
      message: "Lesson plan created",
      data: plan,
    });
  } catch (err) {
    console.error(err);
    reply.code(500).send({
      success: false,
      message: err.message || "Unable to create lesson plan",
    });
  }
}

export async function get_lesson_plan_by_id(req, reply) {
  try {
    const { lesson_plan_id } = req.params;
    const plan = await getLessonPlanById(lesson_plan_id);

    if (!plan) {
      return reply.code(404).send({
        success: false,
        message: "Lesson plan not found",
      });
    }

    reply.send({ success: true, data: plan });
  } catch (err) {
    console.error(err);
    reply.code(500).send({
      success: false,
      message: err.message || "Unable to fetch lesson plan",
    });
  }
}

export async function list_lesson_plans(req, reply) {
  try {
    const q = req.query || {};
    const {
      teacher_id,
      campus_id,
      subject_id,
      class_id,
      section_id,
      status,
      start_date,
      end_date,
      limit,
      offset,
    } = q;

    if (!teacher_id && !campus_id) {
      return reply.code(400).send({
        success: false,
        message: "Provide teacher_id and/or campus_id to list lesson plans",
      });
    }

    const plans = await listLessonPlans({
      teacherId: teacher_id,
      campusId: campus_id,
      subjectId: subject_id,
      classId: class_id,
      sectionId: section_id,
      status,
      startDate: start_date,
      endDate: end_date,
      limit: limit ?? 50,
      offset: offset ?? 0,
    });

    reply.send({
      success: true,
      data: plans,
      count: plans.length,
    });
  } catch (err) {
    console.error(err);
    reply.code(500).send({
      success: false,
      message: err.message || "Unable to list lesson plans",
    });
  }
}

export async function update_lesson_plan(req, reply) {
  try {
    const { lesson_plan_id } = req.params;
    const body = req.body;

    const existing = await getLessonPlanById(lesson_plan_id);
    if (!existing) {
      return reply.code(404).send({
        success: false,
        message: "Lesson plan not found",
      });
    }

    const nextSubject = body.subject_id ?? existing.subject.subject_id;
    const nextClass = body.class_id ?? existing.class.class_id;
    const nextSection =
      body.section_id !== undefined ? body.section_id : existing.section?.section_id ?? null;

    const scope = await validateLessonPlanScope({
      teacherId: existing.teacher.teacher_id,
      subjectId: nextSubject,
      classId: nextClass,
      sectionId: nextSection,
    });

    if (!scope.ok) {
      return reply.code(400).send({ success: false, message: scope.message });
    }

    const patch = {};
    if (body.lesson_date !== undefined) patch.lessonDate = body.lesson_date;
    if (body.chapter_topic !== undefined) patch.chapterTopic = body.chapter_topic;
    if (body.learning_objectives !== undefined) {
      patch.learningObjectives = body.learning_objectives;
    }
    if (body.activities !== undefined) patch.activities = body.activities;
    if (body.homework !== undefined) patch.homework = body.homework;
    if (body.status !== undefined) patch.status = body.status;
    if (body.subject_id !== undefined) patch.subjectId = body.subject_id;
    if (body.class_id !== undefined) patch.classId = body.class_id;
    if (body.section_id !== undefined) patch.sectionId = body.section_id;

    const plan = await updateLessonPlan(lesson_plan_id, patch);

    reply.send({
      success: true,
      message: "Lesson plan updated",
      data: plan,
    });
  } catch (err) {
    console.error(err);
    reply.code(500).send({
      success: false,
      message: err.message || "Unable to update lesson plan",
    });
  }
}

export async function delete_lesson_plan(req, reply) {
  try {
    const { lesson_plan_id } = req.params;
    const ok = await deleteLessonPlan(lesson_plan_id);

    if (!ok) {
      return reply.code(404).send({
        success: false,
        message: "Lesson plan not found",
      });
    }

    reply.send({ success: true, message: "Lesson plan deleted" });
  } catch (err) {
    console.error(err);
    reply.code(500).send({
      success: false,
      message: err.message || "Unable to delete lesson plan",
    });
  }
}

export async function add_lesson_plan_attachments(req, reply) {
  try {
    const { lesson_plan_id } = req.params;
    const { attachments } = req.body;

    const existing = await getLessonPlanById(lesson_plan_id);
    if (!existing) {
      return reply.code(404).send({
        success: false,
        message: "Lesson plan not found",
      });
    }

    const plan = await addLessonPlanAttachments(lesson_plan_id, attachments);

    reply.send({
      success: true,
      message: "Attachments added",
      data: plan,
    });
  } catch (err) {
    console.error(err);
    reply.code(500).send({
      success: false,
      message: err.message || "Unable to add attachments",
    });
  }
}

export async function remove_lesson_plan_attachment(req, reply) {
  try {
    const { attachment_id } = req.params;

    const lessonPlanId = await getAttachmentLessonPlanId(attachment_id);
    if (!lessonPlanId) {
      return reply.code(404).send({
        success: false,
        message: "Attachment not found",
      });
    }

    const ok = await removeLessonPlanAttachment(attachment_id);
    if (!ok) {
      return reply.code(404).send({
        success: false,
        message: "Attachment not found",
      });
    }

    const plan = await getLessonPlanById(lessonPlanId);

    reply.send({
      success: true,
      message: "Attachment removed",
      data: plan,
    });
  } catch (err) {
    console.error(err);
    reply.code(500).send({
      success: false,
      message: err.message || "Unable to remove attachment",
    });
  }
}

export async function generate_lesson_plan_attachment_upload_url(req, reply) {
  try {
    let { lesson_plan_id, file_name, mime_type } = req.body;

    if (!file_name || !mime_type) {
      return reply.code(400).send({
        success: false,
        message: "file_name and mime_type are required",
      });
    }

    if (!lesson_plan_id) {
      lesson_plan_id = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/tiff",
      "image/bmp",
      "image/ico",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ];

    if (!allowedMimeTypes.includes(mime_type)) {
      return reply.code(400).send({
        success: false,
        message:
          "Invalid file type. Allowed: documents, images, and common video formats (mp4, webm, mov, avi).",
      });
    }

    const result = await generateDocumentUploadSignedUrl({
      entity: "lesson-plan",
      entityId: lesson_plan_id,
      fileName: file_name,
      mimeType: mime_type,
    });

    reply.send({
      success: true,
      message: "Signed URL generated successfully",
      data: {
        lessonPlanId: lesson_plan_id,
        uploadUrl: result.uploadUrl,
        publicUrl: result.publicUrl,
        objectPath: result.objectPath,
      },
    });
  } catch (err) {
    console.error(err);
    reply.code(500).send({
      success: false,
      message: err.message || "Unable to generate upload URL",
    });
  }
}
