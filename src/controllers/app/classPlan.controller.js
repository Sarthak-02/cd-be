import {
  seedClassPlanFromMaster,
  createClassPlan,
  getClassPlanById,
  listClassPlans,
  updateClassPlan,
  deleteClassPlan,
  addClassPlanTopics,
  updateClassPlanTopic,
  deleteClassPlanTopic,
  getTopicClassPlanId,
  createTopicProgress,
  updateTopicProgress,
  deleteTopicProgress,
  addTopicMaterial,
  deleteTopicMaterial,
  addTopicAssignment,
  updateTopicAssignment,
  deleteTopicAssignment,
  addTopicQuiz,
  updateTopicQuiz,
  deleteTopicQuiz,
} from "../../db/classPlan.db.js";

export async function seed_class_plan_from_master(req, reply) {
  try {
    const { board, subject, class_name, campus_id, teacher_id, is_published = false } = req.body;

    const result = await seedClassPlanFromMaster({
      board,
      subject,
      className: class_name,
      campusId: campus_id,
      teacherId: teacher_id,
      isPublished: is_published,
    });

    if (!result.ok) {
      return reply.code(404).send({ success: false, message: result.message });
    }

    reply.code(201).send({ success: true, message: "Class plan seeded from master", data: result.plan });
  } catch (err) {
    if (err.code === "P2002") {
      return reply.code(409).send({
        success: false,
        message: "A class plan for this teacher, campus, class, and subject already exists",
      });
    }
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to seed class plan" });
  }
}

function toTopicDbShape(t) {
  return {
    chapterTitle: t.chapter_title,
    chapterNumber: t.chapter_number ?? null,
    title: t.title,
    displayOrder: t.display_order,
  };
}

// ─── Class Plan ───────────────────────────────────────────────────────────────

export async function create_class_plan(req, reply) {
  try {
    const {
      master_plan_id,
      campus_id,
      teacher_id,
      class_id,
      subject,
      academic_year,
      is_published = false,
      topics = [],
    } = req.body;

    const plan = await createClassPlan({
      masterPlanId: master_plan_id ?? null,
      campusId: campus_id,
      teacherId: teacher_id,
      classId: class_id,
      subject,
      academicYear: academic_year,
      isPublished: is_published,
      topics: topics.map(toTopicDbShape),
    });

    reply.code(201).send({ success: true, message: "Class plan created", data: plan });
  } catch (err) {
    if (err.code === "P2002") {
      return reply.code(409).send({
        success: false,
        message: "A class plan for this teacher, campus, class, subject, and academic year already exists",
      });
    }
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to create class plan" });
  }
}

export async function get_class_plan_by_id(req, reply) {
  try {
    const { section_id } = req.query || {};
    const plan = await getClassPlanById(req.params.class_plan_id, section_id);

    if (!plan) {
      return reply.code(404).send({ success: false, message: "Class plan not found" });
    }

    reply.send({ success: true, data: plan });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to fetch class plan" });
  }
}

export async function list_class_plans(req, reply) {
  try {
    const {
      campus_id,
      teacher_id,
      section_id,
      class_id,
      subject,
      academic_year,
      is_published,
      limit = 50,
      offset = 0,
    } = req.query || {};

    if (!campus_id && !teacher_id && !section_id) {
      return reply.code(400).send({
        success: false,
        message: "Provide section_id, campus_id, and/or teacher_id to list class plans",
      });
    }

    const { rows, total } = await listClassPlans({
      campusId: campus_id,
      teacherId: teacher_id,
      sectionId: section_id,
      classId: class_id,
      subject,
      academicYear: academic_year,
      isPublished: is_published,
      limit,
      offset,
    });

    reply.send({ success: true, data: rows, count: rows.length, total });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to list class plans" });
  }
}

export async function update_class_plan(req, reply) {
  try {
    const { class_plan_id } = req.params;
    const body = req.body;

    const patch = {};
    if (body.master_plan_id !== undefined) patch.masterPlanId = body.master_plan_id;
    if (body.class_id !== undefined) patch.classId = body.class_id;
    if (body.subject !== undefined) patch.subject = body.subject;
    if (body.academic_year !== undefined) patch.academicYear = body.academic_year;
    if (body.is_published !== undefined) patch.isPublished = body.is_published;

    const plan = await updateClassPlan(class_plan_id, patch);

    if (!plan) {
      return reply.code(404).send({ success: false, message: "Class plan not found" });
    }

    reply.send({ success: true, message: "Class plan updated", data: plan });
  } catch (err) {
    if (err.code === "P2002") {
      return reply.code(409).send({
        success: false,
        message: "A class plan for this teacher, campus, class, subject, and academic year already exists",
      });
    }
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to update class plan" });
  }
}

export async function delete_class_plan(req, reply) {
  try {
    const ok = await deleteClassPlan(req.params.class_plan_id);

    if (!ok) {
      return reply.code(404).send({ success: false, message: "Class plan not found" });
    }

    reply.send({ success: true, message: "Class plan deleted" });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to delete class plan" });
  }
}

// ─── Topics ───────────────────────────────────────────────────────────────────

export async function add_class_plan_topics(req, reply) {
  try {
    const { class_plan_id } = req.params;

    const existing = await getClassPlanById(class_plan_id);
    if (!existing) {
      return reply.code(404).send({ success: false, message: "Class plan not found" });
    }

    const plan = await addClassPlanTopics(class_plan_id, req.body.topics.map(toTopicDbShape));

    reply.send({ success: true, message: "Topics added", data: plan });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to add topics" });
  }
}

export async function update_class_plan_topic(req, reply) {
  try {
    const { topic_id } = req.params;
    const body = req.body;

    const patch = {};
    if (body.chapter_title !== undefined) patch.chapterTitle = body.chapter_title;
    if (body.chapter_number !== undefined) patch.chapterNumber = body.chapter_number;
    if (body.title !== undefined) patch.title = body.title;
    if (body.display_order !== undefined) patch.displayOrder = body.display_order;

    const topic = await updateClassPlanTopic(topic_id, patch);

    if (!topic) {
      return reply.code(404).send({ success: false, message: "Topic not found" });
    }

    reply.send({ success: true, message: "Topic updated", data: topic });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to update topic" });
  }
}

export async function delete_class_plan_topic(req, reply) {
  try {
    const { topic_id } = req.params;

    const classPlanId = await getTopicClassPlanId(topic_id);
    if (!classPlanId) {
      return reply.code(404).send({ success: false, message: "Topic not found" });
    }

    await deleteClassPlanTopic(topic_id);

    reply.send({ success: true, message: "Topic deleted" });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to delete topic" });
  }
}

// ─── Topic Progress ───────────────────────────────────────────────────────────

export async function create_topic_progress(req, reply) {
  try {
    const { topic_id } = req.params;
    const { section_id, status, scheduled_date, completed_on, actual_duration_mins, teacher_notes, is_added_by_teacher } = req.body;

    const progress = await createTopicProgress(topic_id, section_id, {
      status,
      scheduledDate: scheduled_date ? new Date(scheduled_date) : null,
      completedOn: completed_on ? new Date(completed_on) : null,
      actualDurationMins: actual_duration_mins ?? null,
      teacherNotes: teacher_notes ?? null,
      isAddedByTeacher: is_added_by_teacher ?? false,
    });

    reply.code(201).send({ success: true, message: "Progress created", data: progress });
  } catch (err) {
    if (err.code === "P2003") {
      return reply.code(404).send({ success: false, message: "Topic not found" });
    }
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to create progress" });
  }
}

export async function update_topic_progress(req, reply) {
  try {
    const { progress_id } = req.params;
    const body = req.body;

    const patch = {};
    if (body.status !== undefined) patch.status = body.status;
    if (body.scheduled_date !== undefined) {
      patch.scheduledDate = body.scheduled_date ? new Date(body.scheduled_date) : null;
    }
    if (body.completed_on !== undefined) {
      patch.completedOn = body.completed_on ? new Date(body.completed_on) : null;
    }
    if (body.actual_duration_mins !== undefined) patch.actualDurationMins = body.actual_duration_mins;
    if (body.teacher_notes !== undefined) patch.teacherNotes = body.teacher_notes;
    if (body.is_added_by_teacher !== undefined) patch.isAddedByTeacher = body.is_added_by_teacher;

    const progress = await updateTopicProgress(progress_id, patch);

    if (!progress) {
      return reply.code(404).send({ success: false, message: "Progress not found" });
    }

    reply.send({ success: true, message: "Progress updated", data: progress });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to update progress" });
  }
}

export async function delete_topic_progress(req, reply) {
  try {
    const ok = await deleteTopicProgress(req.params.progress_id);

    if (!ok) return reply.code(404).send({ success: false, message: "Progress not found" });

    reply.send({ success: true, message: "Progress deleted" });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to delete progress" });
  }
}

// ─── Materials ────────────────────────────────────────────────────────────────

export async function add_topic_material(req, reply) {
  try {
    const { progress_id } = req.params;
    const { file_name, file_url } = req.body;

    const material = await addTopicMaterial(progress_id, { fileName: file_name, fileUrl: file_url });

    reply.code(201).send({ success: true, message: "Material added", data: material });
  } catch (err) {
    if (err.code === "P2003") {
      return reply.code(404).send({ success: false, message: "Progress not found" });
    }
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to add material" });
  }
}

export async function delete_topic_material(req, reply) {
  try {
    const ok = await deleteTopicMaterial(req.params.material_id);

    if (!ok) return reply.code(404).send({ success: false, message: "Material not found" });

    reply.send({ success: true, message: "Material deleted" });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to delete material" });
  }
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function add_topic_assignment(req, reply) {
  try {
    const { progress_id } = req.params;
    const { title, due_date, file_url, status, content } = req.body;

    const assignment = await addTopicAssignment(progress_id, {
      title,
      dueDate: due_date,
      fileUrl: file_url,
      status,
      content,
    });

    reply.code(201).send({ success: true, message: "Assignment added", data: assignment });
  } catch (err) {
    if (err.code === "P2003") {
      return reply.code(404).send({ success: false, message: "Progress not found" });
    }
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to add assignment" });
  }
}

export async function update_topic_assignment(req, reply) {
  try {
    const { assignment_id } = req.params;
    const body = req.body;

    const patch = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.due_date !== undefined) patch.dueDate = body.due_date;
    if (body.file_url !== undefined) patch.fileUrl = body.file_url;
    if (body.status !== undefined) patch.status = body.status;
    if (body.content !== undefined) patch.content = body.content;

    const assignment = await updateTopicAssignment(assignment_id, patch);

    if (!assignment) return reply.code(404).send({ success: false, message: "Assignment not found" });

    reply.send({ success: true, message: "Assignment updated", data: assignment });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to update assignment" });
  }
}

export async function delete_topic_assignment(req, reply) {
  try {
    const ok = await deleteTopicAssignment(req.params.assignment_id);

    if (!ok) return reply.code(404).send({ success: false, message: "Assignment not found" });

    reply.send({ success: true, message: "Assignment deleted" });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to delete assignment" });
  }
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────

export async function add_topic_quiz(req, reply) {
  try {
    const { progress_id } = req.params;
    const { title, generated_by_ai, file_url, content } = req.body;

    const quiz = await addTopicQuiz(progress_id, {
      title,
      generatedByAi: generated_by_ai ?? false,
      fileUrl: file_url,
      content,
    });

    reply.code(201).send({ success: true, message: "Quiz added", data: quiz });
  } catch (err) {
    if (err.code === "P2003") {
      return reply.code(404).send({ success: false, message: "Progress not found" });
    }
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to add quiz" });
  }
}

export async function update_topic_quiz(req, reply) {
  try {
    const { quiz_id } = req.params;
    const body = req.body;

    const patch = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.generated_by_ai !== undefined) patch.generatedByAi = body.generated_by_ai;
    if (body.file_url !== undefined) patch.fileUrl = body.file_url;
    if (body.content !== undefined) patch.content = body.content;

    const quiz = await updateTopicQuiz(quiz_id, patch);

    if (!quiz) return reply.code(404).send({ success: false, message: "Quiz not found" });

    reply.send({ success: true, message: "Quiz updated", data: quiz });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to update quiz" });
  }
}

export async function delete_topic_quiz(req, reply) {
  try {
    const ok = await deleteTopicQuiz(req.params.quiz_id);

    if (!ok) return reply.code(404).send({ success: false, message: "Quiz not found" });

    reply.send({ success: true, message: "Quiz deleted" });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: err.message || "Unable to delete quiz" });
  }
}
