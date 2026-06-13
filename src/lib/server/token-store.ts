import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";

/**
 * Encrypted-at-rest token store (server-only).
 *
 * OAuth tokens are encrypted with AES-256-GCM using a key derived from
 * TOKEN_ENCRYPTION_KEY and written to `.data/google-token.enc` (git-ignored).
 * The browser never sees tokens; they live only on the server. Single-user /
 * localhost design — swap the file for a per-user DB if you ever go multi-user.
 */

const DATA_DIR = path.join(process.cwd(), ".data");
const TOKEN_FILE = path.join(DATA_DIR, "google-token.enc");
const ALGO = "aes-256-gcm";

export function hasEncryptionKey(): boolean {
  return Boolean(process.env.TOKEN_ENCRYPTION_KEY);
}

function key(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error("TOKEN_ENCRYPTION_KEY is not set");
  // Derive a 32-byte key from any-length secret.
  return scryptSync(secret, "jarvis.token.store.v1", 32);
}

function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
}

function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  const decipher = createDecipheriv(ALGO, key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** Persist an arbitrary JSON-serialisable session object (encrypted). */
export async function saveSession(session: unknown): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(TOKEN_FILE, encrypt(JSON.stringify(session)), "utf8");
}

/** Load the stored session, or null if none / unreadable. */
export async function loadSession<T = unknown>(): Promise<T | null> {
  try {
    const raw = await readFile(TOKEN_FILE, "utf8");
    return JSON.parse(decrypt(raw)) as T;
  } catch {
    return null;
  }
}

/** Remove the stored session. */
export async function clearSession(): Promise<void> {
  await rm(TOKEN_FILE, { force: true });
}
