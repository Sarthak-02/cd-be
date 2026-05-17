import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

// Lazy-initialised key buffers so env is always loaded first.
let _encKey = null;
let _hmacKey = null;

function getKeys() {
  if (_encKey) return { encKey: _encKey, hmacKey: _hmacKey };
  const encHex = process.env.ENCRYPTION_KEY || "";
  const hmacHex = process.env.BLIND_INDEX_KEY || "";
  if (encHex.length !== 64)
    throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  if (hmacHex.length !== 64)
    throw new Error("BLIND_INDEX_KEY must be a 64-char hex string (32 bytes)");
  _encKey = Buffer.from(encHex, "hex");
  _hmacKey = Buffer.from(hmacHex, "hex");
  return { encKey: _encKey, hmacKey: _hmacKey };
}

// Format: enc:<base64(iv || authTag || ciphertext)>
// The "enc:" prefix makes encrypted values unambiguous.
export function encrypt(plaintext) {
  if (plaintext == null) return plaintext;
  const { encKey } = getKeys();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encKey, iv);
  const body = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, body]);
  return "enc:" + payload.toString("base64");
}

export function decrypt(ciphertext) {
  if (ciphertext == null) return ciphertext;
  if (!ciphertext.startsWith("enc:")) return ciphertext;
  const { encKey } = getKeys();
  const payload = Buffer.from(ciphertext.slice(4), "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const body = payload.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", encKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}

// Deterministic HMAC-SHA256 for searchable/unique fields.
export function blindIndex(value) {
  if (value == null) return null;
  const { hmacKey } = getKeys();
  return crypto
    .createHmac("sha256", hmacKey)
    .update(String(value).trim())
    .digest("hex");
}

export function makeDedupeKey({ sessionId, parentId = "parent", channel = "APP", receiverId }) {
  return crypto
    .createHash("sha256")
    .update(`${sessionId}|${parentId}|${channel}|${receiverId}`)
    .digest("hex");
}
