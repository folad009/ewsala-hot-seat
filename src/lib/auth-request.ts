import { getSessionCookieName, verifySessionToken } from "@/lib/auth-session";
import { getUserById } from "@/lib/auth-store";
import { cookies } from "next/headers";

export async function getAuthenticatedWebUser(): Promise<{ phone: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const user = await getUserById(payload.userId);
  if (!user) return null;
  return { phone: user.phone };
}
