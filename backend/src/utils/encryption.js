import crypto from "node:crypto";

const algorithm = "aes-256-gcm";

function getEncryptionKey() {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY;

  if (!keyHex || !/^[0-9a-f]{64}$/i.test(keyHex)) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be a 32-byte hexadecimal value");
  }

  return Buffer.from(keyHex, "hex");
}

export function encryptToken(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);

  return [iv.toString("hex"), cipher.getAuthTag().toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptToken(value) {
  const parts = value.split(":");

  if (parts.length !== 3 || parts.some((part) => !/^[0-9a-f]+$/i.test(part))) {
    throw new Error("Encrypted token has an invalid format");
  }

  const [ivHex, tagHex, encryptedHex] = parts;

  if (ivHex.length !== 24 || tagHex.length !== 32) {
    throw new Error("Encrypted token has an invalid format");
  }

  const decipher = crypto.createDecipheriv(algorithm, getEncryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]).toString("utf8");
}
