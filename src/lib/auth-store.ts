import { prisma } from "@/lib/prisma";
import { randomUUID, scryptSync, timingSafeEqual } from "crypto";

type PublicUser = { id: string; phone: string };

export function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "");
}

function hashPassword(password: string): string {
  const salt = randomUUID();
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, encoded: string): boolean {
  const [salt, expectedHex] = encoded.split(":");
  if (!salt || !expectedHex) return false;
  const calculated = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  if (calculated.length !== expected.length) return false;
  return timingSafeEqual(calculated, expected);
}

export async function createUser(phone: string, password: string): Promise<PublicUser> {
  const normalized = normalizePhone(phone);
  const existing = await prisma.user.findUnique({ where: { phone: normalized } });
  if (existing) throw new Error("User already exists");

  return prisma.user.create({
    data: {
      phone: normalized,
      passwordHash: hashPassword(password),
    },
    select: {
      id: true,
      phone: true,
    },
  });
}

export async function authenticateUser(
  phone: string,
  password: string,
): Promise<PublicUser | null> {
  const normalized = normalizePhone(phone);
  const user = await prisma.user.findUnique({
    where: { phone: normalized },
    select: {
      id: true,
      phone: true,
      passwordHash: true,
    },
  });
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return { id: user.id, phone: user.phone };
}

export async function getUserByPhone(phone: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({
    where: { phone: normalizePhone(phone) },
    select: {
      id: true,
      phone: true,
    },
  });
  if (!user) return null;
  return user;
}

export async function getUserById(userId: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
    },
  });
  if (!user) return null;
  return user;
}

export async function resetUserPasswordByPhone(
  phone: string,
  nextPassword: string,
): Promise<boolean> {
  const normalized = normalizePhone(phone);
  const updated = await prisma.user.updateMany({
    where: { phone: normalized },
    data: {
      passwordHash: hashPassword(nextPassword),
    },
  });
  return updated.count > 0;
}
