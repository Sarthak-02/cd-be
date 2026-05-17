import { Storage } from "@google-cloud/storage";
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config();

const storage = new Storage({
    projectId: process.env.GOOGLE_PROJECT_ID,
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY,
    },
});

const PROFILE_BUCKET_NAME = process.env.DOCUMENT_BUCKET_NAME;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EXTENSION_MAP = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/**
 * Generate a signed URL so the client can upload a pickup photo directly to GCS.
 * The file lands at original/pickup/{entity}/{entityId}.{ext} temporarily.
 */
export async function generatePickupPhotoUploadUrl({ entity, entityId, mimeType }) {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        throw new Error(`Unsupported image type: ${mimeType}. Allowed: jpeg, png, webp`);
    }

    const ext = EXTENSION_MAP[mimeType];
    const objectPath = `pickup/${entity}/${entityId}.${ext}`;
    const file = storage.bucket(PROFILE_BUCKET_NAME).file(objectPath);

    const [uploadUrl] = await file.getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 10 * 60 * 1000, // 10 minutes
        contentType: mimeType,
    });

    return { uploadUrl, objectPath };
}

/**
 * Download the uploaded image from GCS, apply lossless WebP compression,
 * re-upload to the final path, delete the original, and return the public URL.
 */
export async function compressAndStorePickupPhoto({ objectPath, entity, entityId }) {
    const bucket = storage.bucket(PROFILE_BUCKET_NAME);

    // 1. Download original from GCS
    const [buffer] = await bucket.file(objectPath).download();

    // 2. Lossless WebP compression via sharp
    const compressed = await sharp(buffer)
        .webp({ lossless: true })
        .toBuffer();

    // 3. Upload compressed version to final path
    const finalPath = `pickup/${entity}/${entityId}.webp`;
    const finalFile = bucket.file(finalPath);

    await finalFile.save(compressed, {
        contentType: "image/webp",
        metadata: { cacheControl: "public, max-age=31536000" },
    });

    // 4. Delete the original temp upload
    try {
        await bucket.file(objectPath).delete();
    } catch (_) {
        // Non-fatal — original may already be gone
    }

    const publicUrl = `https://storage.googleapis.com/${PROFILE_BUCKET_NAME}/${finalPath}`;
    return { publicUrl, objectPath: finalPath };
}
