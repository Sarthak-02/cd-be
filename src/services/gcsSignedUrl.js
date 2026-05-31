import { Storage } from "@google-cloud/storage";
import dotenv from 'dotenv'

dotenv.config()

// Initialize Storage with credentials
const storage = new Storage({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  },
});

const PROFILE_BUCKET_NAME = process.env.PROFILE_BUCKET_NAME
const DOCUMENT_BUCKET_NAME = process.env.DOCUMENT_BUCKET_NAME
const EXTENSION_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const DOCUMENT_EXTENSION_MAP = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/tiff": "tiff",
  "image/bmp": "bmp",
  "image/ico": "ico",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
};

export async function generateImageUploadSignedUrl({
  entity,
  entityId,
  mimeType,
}) {
  const ext = EXTENSION_MAP[mimeType];

  const objectPath = `original/${entity}/${entityId}.${ext}`;
  const file = storage.bucket(PROFILE_BUCKET_NAME).file(objectPath);

  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    contentType: mimeType,
  });

  const basePublicPath = `https://storage.googleapis.com/${PROFILE_BUCKET_NAME}/${entity}/${entityId}`;

  return {
    uploadUrl,
    objectPath,
    expectedUrls: {
      original:`https://storage.googleapis.com/${PROFILE_BUCKET_NAME}/original/${entity}/${entityId}.${ext}`,
      full: `${basePublicPath}/full.webp`,
      medium: `${basePublicPath}/medium_512.webp`,
      thumb: `${basePublicPath}/thumb_128.webp`,
    },
  };
}

export async function generateDocumentUploadSignedUrl({
  entity,
  entityId,
  fileName,
  mimeType,
  campus_id,
}) {
  const ext = DOCUMENT_EXTENSION_MAP[mimeType];

  if (!ext) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const prefix = campus_id ? campus_id : 'documents';
  const objectPath = `${prefix}/${entity}/${entityId}/${timestamp}_${sanitizedFileName}`;
  const file = storage.bucket(DOCUMENT_BUCKET_NAME).file(objectPath);

  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType: mimeType,
  });

  const [downloadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const publicUrl = `https://storage.googleapis.com/${DOCUMENT_BUCKET_NAME}/${objectPath}`;

  return {
    uploadUrl,
    downloadUrl,
    objectPath,
    publicUrl,
  };
}
