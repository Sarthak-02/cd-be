import { Storage } from "@google-cloud/storage";
import dotenv from 'dotenv'

const storage = new Storage();

dotenv.config()

const BUCKET_NAME = process.env.PROFILE_BUCKET_NAME

const EXTENSION_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function generateImageUploadSignedUrl({
  entity,
  entityId,
  mimeType,
}) {
  const ext = EXTENSION_MAP[mimeType];

  const objectPath = `original/${entity}/${entityId}.${ext}`;
  const file = storage.bucket(BUCKET_NAME).file(objectPath);

  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    contentType: mimeType,
  });

  const basePublicPath = `https://storage.googleapis.com/${BUCKET_NAME}/${entity}/${entityId}`;

  return {
    uploadUrl,
    objectPath,
    expectedUrls: {
      original:`https://storage.googleapis.com/${BUCKET_NAME}/original/${entity}/${entityId}.${ext}`,
      full: `${basePublicPath}/full.webp`,
      medium: `${basePublicPath}/medium_512.webp`,
      thumb: `${basePublicPath}/thumb_128.webp`,
    },
  };
}
