import {  getUser, validateUser } from "../db/user.db.js";
import bcrypt from "bcrypt"
import { clearCache, getUserDetails } from "../utils/cache/user.cache.js";

export async function loginController(req, reply) {
  const { userid, password } = req.body;

  // 1. Find user
  const user = await getUserDetails(userid)

  // 2. If user not found
  if (!user) {
    return reply.code(401).send({ error: "Invalid credentials" });
  }

  // 3. Validate password
  const isPasswordValid = await bcrypt.compare(password, user?.password);

  if (!isPasswordValid) {
    return reply.code(401).send({ error: "Invalid credentials" });
  }

  // 4. Create JWT
  const token = req.server.jwt.sign({ userid }, { expiresIn: "1d" });

  // 5. Set cookie
  reply.setCookie("token", token, {
    httpOnly: true,
    secure: true,        // 🔥 Required for HTTPS
    sameSite: "none",    // 🔥 Required for cross-site cookies
    path: "/",
    maxAge: 86400
  });

  // Remove password before sending
  delete user.password;
  
  reply.send({
    success: true,
    message: "Logged in",
    data: user,
  });
}
  
export const logoutController = async (req, reply) => {

    //clear the cache
    clearCache()

    // Clear the cookie
    reply.clearCookie("token", {
      path: "/",       
      httpOnly: true,
      sameSite: "strict",
      secure: true
    });
  
    return reply.send({
      success: true,
      message: "Logged out successfully"
    });
  };

// export async function signupController(req,reply){
//   try{

//   }
//   catch(err){
//     console.log(err)
//   }
// }