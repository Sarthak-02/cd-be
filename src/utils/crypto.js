import crypto from "crypto";

const algorithm = "aes-256-gcm";
const key = crypto.randomBytes(32);  // 256-bit key
const iv = crypto.randomBytes(12);   // recommended IV size for GCM

export function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decrypt({ encrypted, iv, tag }) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function makeDedupeKey({ sessionId, parentId, channel, studentId }) {
  return crypto
    .createHash("sha256")
    .update(`${sessionId}|${parentId}|${channel}|${studentId}`)
    .digest("hex");
}