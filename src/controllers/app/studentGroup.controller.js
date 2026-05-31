import {
    createStudentGroup,
    getStudentGroupById,
    getStudentGroupsByCampus,
    updateStudentGroup,
    deleteStudentGroup,
    addStudentGroupMembers,
    removeStudentGroupMembers,
} from "../../db/studentGroup.db.js";

export async function create_student_group(req, reply) {
    try {
        const { name, description, campus_id, created_by } = req.body;

        const group = await createStudentGroup({
            name,
            description,
            campusId: campus_id,
            createdBy: created_by,
        });

        reply.code(201).send({ success: true, message: "Group created successfully", data: group });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: err.message || "Unable to create group" });
    }
}

export async function get_student_group_by_id(req, reply) {
    try {
        const { group_id } = req.params;

        const group = await getStudentGroupById(group_id);
        if (!group) {
            return reply.code(404).send({ success: false, message: "Group not found" });
        }

        reply.send({ success: true, data: group });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: "Unable to fetch group" });
    }
}

export async function list_student_groups(req, reply) {
    try {
        const { campus_id, created_by, limit, offset } = req.query;

        const groups = await getStudentGroupsByCampus({
            campusId: campus_id,
            createdBy: created_by,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0,
        });

        reply.send({ success: true, data: groups, count: groups.length });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: "Unable to fetch groups" });
    }
}

export async function update_student_group(req, reply) {
    try {
        const { group_id } = req.params;
        const { name, description } = req.body;

        const existing = await getStudentGroupById(group_id);
        if (!existing) {
            return reply.code(404).send({ success: false, message: "Group not found" });
        }

        const group = await updateStudentGroup({ groupId: group_id, name, description });
        reply.send({ success: true, message: "Group updated successfully", data: group });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: err.message || "Unable to update group" });
    }
}

export async function delete_student_group(req, reply) {
    try {
        const { group_id } = req.params;

        const existing = await getStudentGroupById(group_id);
        if (!existing) {
            return reply.code(404).send({ success: false, message: "Group not found" });
        }

        await deleteStudentGroup(group_id);
        reply.send({ success: true, message: "Group deleted successfully" });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: "Unable to delete group" });
    }
}

export async function add_group_members(req, reply) {
    try {
        const { group_id } = req.params;
        const { student_ids } = req.body;

        const existing = await getStudentGroupById(group_id);
        if (!existing) {
            return reply.code(404).send({ success: false, message: "Group not found" });
        }

        const group = await addStudentGroupMembers(group_id, student_ids);
        reply.send({ success: true, message: "Members added successfully", data: group });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: err.message || "Unable to add members" });
    }
}

export async function remove_group_members(req, reply) {
    try {
        const { group_id } = req.params;
        const { student_ids } = req.body;

        const existing = await getStudentGroupById(group_id);
        if (!existing) {
            return reply.code(404).send({ success: false, message: "Group not found" });
        }

        const group = await removeStudentGroupMembers(group_id, student_ids);
        reply.send({ success: true, message: "Members removed successfully", data: group });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ success: false, message: "Unable to remove members" });
    }
}
