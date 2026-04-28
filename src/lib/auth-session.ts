import { prisma } from "@/lib/prisma";
import { createHash, randomBytes } from "crypto";

const COOKIE_NAME = "eswala_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSessionToken(userId: string): Promise<string> {
  const token = randomBytes(48).toString("base64url");
  await prisma.session.create({
    data: {
      tokenHash: tokenHash(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

export async function verifySessionToken(
  token: string,
): Promise<{ userId: string } | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    select: { userId: true, expiresAt: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
    return null;
  }
  return { userId: session.userId };
}

export async function revokeSessionToken(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
}

export function getSessionCookieMaxAge(): number {
  return SESSION_TTL_SECONDS;
}
