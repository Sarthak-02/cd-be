
import {
  createClass,
  getClass,
  getAllClasses,
  updateClass,
  deleteClass
} from "../../db/class.db.js";
import { createSection } from "../../db/section.db.js";

export async function class_post(req, reply) {
  try {
    const data = req.body;
    const result = await createClass(data);

    if (!result) throw new Error();

    const extras = data?.extras || {}
    const has_sections = extras?.class_has_sections ?? false

    if (!has_sections) {
      // create a default section
      const section_payload = {
        section_name: data?.class_name,
        section_short_name: data?.class_short_name,
        section_teacher_id: data?.class_teacher_id,
        section_room_no: data?.class_room_no,
        class_id: result.class_id,
        extras: {
          section_max_students: extras?.class_max_students
        }
      }

      const section_created = await createSection(section_payload)

      if (!section_created) {
        throw new Error()
      }
    }

    reply.send({ success: true, message: "Class Created Successfully" });
  } catch (err) {
    console.log(err);
    reply.code(400).send({ success: false, message: "Unable to create Class" });
  }
}

export async function class_put(req, reply) {
  try {
    const data = req.body;
    const result = await updateClass(data);

    if (!result) throw new Error();

    reply.send({ success: true, message: "Class Updated Successfully", data: result });
  } catch (err) {
    console.log(err);
    reply.code(400).send({ success: false, message: "Unable to update Class" });
  }
}

export async function class_get(req, reply) {
  try {
    const { class_id } = req.query;
    const cls = await getClass(class_id);

    reply.send({ success: true, message: "Fetched Class details", data: cls });
  } catch (err) {
    console.log(err);
    reply.code(400).send({ success: false, message: "Unable to fetch Class details" });
  }
}

export async function class_all_get(req, reply) {
  try {
    const { campus_id } = req.query
    let classes = []
    if (campus_id) {
      classes = await getAllClasses({ extras: true }, { campus_id });

    } else {
      classes = await getAllClasses({ extras: true });
    }
    classes = classes.map((_class) => ({ ..._class, label: _class.class_name, value: _class.class_id }))

    reply.send({ success: true, message: "Fetched all Classes", data: classes });
  } catch (err) {
    console.log(err);
    reply.code(400).send({ success: false, message: "Unable to fetch Classes details" });
  }
}

export async function class_delete(req, reply) {
  try {
    const { class_id } = req.query;
    const result = await deleteClass(class_id);

    if (!result) throw new Error();

    reply.send({ success: true, message: "Class Deleted Successfully" });
  } catch (err) {
    console.log(err);
    reply.code(400).send({ success: false, message: "Unable to delete Class" });
  }
}
