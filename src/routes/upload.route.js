import { generateUploadImageUrlController } from "../controllers/upload.controller.js";
import { generateUploadUrlSchema } from "../schemas/upload.schema.js";

const uploadOpts = {
    schema:{
        body:generateUploadUrlSchema.body
    }
}

export async function uploadRoutes(app,options) {
    app.post("/images/upload-url",uploadOpts,generateUploadImageUrlController)
}