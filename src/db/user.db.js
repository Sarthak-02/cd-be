import fastify from "../app.js"

export async function createUser(data){
    let newUser = null
    try{
        newUser = await fastify.prisma.user.create({data})
    }
    catch(err){
        console.log(err)
        return false
    }

    return true
}

export async function getUser(userid,omit={}) {
    let user = null;
    try {
      user = await fastify.prisma.user.findUnique({
        where: { userid },
        omit
      });
    } catch (err) {
      console.log(err);
    }
    return user;
  }
  

export async function getAllUsers() {
    let users = null
    try{
        users = await fastify.prisma.user.findMany({
          omit: {
            password: true,
          },
        })
    }
    catch(err){
        console.log(err)
    }

    return users
}

export async function updateUser(data) {
  let updateUser = null
    try{
      updateUser = fastify.prisma.user.update({
            where:{
                userid:data?.userid
            },
            data
        })
    }
    catch(err){
        console.log(err)
    }
    return updateUser
}

export async function validateUser(userid,password){
    let user = null;
    try {
      user = await fastify.prisma.user.findUnique({
        where: { userid ,password }
      });
    } catch (err) {
      console.log(err);
    }
    return user;
}


export async function deleteUser(userid) {
  try {
    await fastify.prisma.user.delete({
      where: { userid },
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}