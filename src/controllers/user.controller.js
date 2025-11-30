import { createUser, getAllUsers, getUser, updateUser ,deleteUser } from "../db/user.db.js"
import bcrypt from 'bcrypt'

export async function user_post(req, reply) {
    try {
        let data = req.body
        //to store the encrypted password
        const passwordHash = await bcrypt.hash(data?.password, 10);
        data['password'] = passwordHash
        const result = await createUser(data)

        if (!result){
            throw new Error("Unabel to create user")
        }

        reply.send({ success: true, message: "User Created Successfully"});
    }
    catch (err) {
        console.log(err)
        reply.code(400).send({ success: false, message: "Unable to create User"});
    }
}

export async function user_put(req, reply) {
    try {
        const data = req.body

        //if password is blank , don't update it
        if (data['password']){
            const passwordHash = await bcrypt.hash(data?.password, 10);
            data['password'] = passwordHash
        }else{
            delete data['password']
        }
    
        const user = await updateUser(data)
        if(!user){
            throw new Error()
        }
        reply.send({ success: true, message: "User Updated Successfully",data:user});
    }
    catch (err) {
        console.log(err)
        reply.code(400).send({ success: false, message: "Unable to update User"});
    }
}


export async function user_get(req, reply) {
    try {
        const { userid } = req.query
        const user = await getUser(userid)
        reply.send({ success: true, message: "fetched user details", data: user });
    }
    catch (err) {
        console.log(err)
        reply.code(400).send({ success: false, message: "Unable to fetch User details"});
    }
}

export async function user_all_get(req, reply) {
    try {
        const users = await getAllUsers()
        reply.send({ success: true, message: "fetched all users", data: users });
    }
    catch (err) {
        console.log(err)
        reply.code(400).send({ success: false, message: "Unable to fetch Users details"});
    }
}

export async function user_delete(req, reply) {
    try {
      const { userid } = req.query;
      const result = await deleteUser(userid);
  
      if (!result) throw new Error();
  
      reply.send({ success: true, message: "Student Deleted Successfully" });
    } catch (err) {
      console.log(err);
      reply.code(400).send({ success: false, message: "Unable to delete Student" });
    }
  }