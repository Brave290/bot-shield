import { createHash } from "crypto";

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function verifySecret(secret: string, hash: string): boolean {
  return hashSecret(secret) === hash;
}
