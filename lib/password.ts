import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SALT_LENGTH_BYTES = 16;
const KEY_LENGTH_BYTES = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(SALT_LENGTH_BYTES).toString("hex");
  const digest = scryptSync(password, salt, KEY_LENGTH_BYTES).toString("hex");
  return `${salt}:${digest}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedDigest] = passwordHash.split(":");

  if (!salt || !storedDigest) {
    return false;
  }

  const candidateDigest = scryptSync(password, salt, KEY_LENGTH_BYTES).toString("hex");

  const storedBuffer = Buffer.from(storedDigest, "hex");
  const candidateBuffer = Buffer.from(candidateDigest, "hex");

  if (storedBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, candidateBuffer);
}
