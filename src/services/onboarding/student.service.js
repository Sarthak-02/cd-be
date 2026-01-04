import { getParentsByStudentId } from "../../db/parent.db.js";


export function createParentData(data){
    const {student_primary_contact , student_guardian_email,student_guardian_phone} = data
    let result = {email:student_guardian_email,phone:student_guardian_phone,relation_type:student_primary_contact,name:""}

    switch(student_primary_contact){
        case "father":{
            result['name'] = data?.student_father_name
            return result
        } 
        case "mother":{
            result['name'] = data?.student_mother_name
            return result
        }
        case "guardian":{
            result['name'] = data?.student_guardian_name
            return result
        }
    }

    return result
}

export async function createParent(data){
   
    const parents = await getParentsByStudentId(student_id)
    if(parents) throw Error("Parents with Same detail Already Exists")
    return await createParent(data)

}