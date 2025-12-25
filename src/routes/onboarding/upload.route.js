import { generateUploadImageUrlController } from "../../controllers/onboarding/upload.controller.js";
import { generateUploadUrlSchema } from "../../schemas/onboarding/upload.schema.js";

const uploadOpts = {
    schema:{
        body:generateUploadUrlSchema.body
    }
}

export async function uploadRoutes(app,options) {
    app.post("/images/upload-url",uploadOpts,generateUploadImageUrlController)
}