import { timingSafeEqual } from "node:crypto";
import { compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const sessionCookieName = "nineilhas_admin_session";
const customerSessionCookieName = "nineilhas_customer_session";
const configuredSessionSecret = process.env.ADMIN_SESSION_SECRET;
const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
if (!configuredSessionSecret) {
  throw new Error("ADMIN_SESSION_SECRET não está configurada.");
}
if (!configuredAdminEmail) {
  throw new Error("ADMIN_EMAIL não está configurado.");
}
const customerSessionSecret = new TextEncoder().encode(configuredSessionSecret);
// A versão separa os tokens Admin dos tokens de cliente e invalida apenas sessões Admin antigas.
const adminSessionSecret = new TextEncoder().encode(`${configuredSessionSecret}:admin-session-v2`);

type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  kind?: "CUSTOMER" | "ADMIN" | "CONFIGURED";
  version?: number;
};

type CustomerSessionPayload = {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
};

export async function createSession(payload: SessionPayload) {
  const identity = await resolveAdminIdentity(payload.sub, payload.kind);
  if (!identity) throw new Error("Sem acesso administrativo.");
  const token = await new SignJWT({
    email: identity.email,
    name: identity.name,
    kind: identity.kind,
    version: identity.version,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(adminSessionSecret);

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function createCustomerSession(payload: CustomerSessionPayload) {
  const account = await prisma.customerAccount.findUnique({ where: { id: payload.sub } });
  if (!account?.active) throw new Error("Conta indisponível.");
  const token = await new SignJWT({
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    version: account.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(customerSessionSecret);

  const cookieStore = await cookies();
  cookieStore.set(customerSessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(customerSessionCookieName);
}

export const protectedPrincipalId = "configured-admin";
export type AdminIdentity = { id: string; email: string; name: string; role: "SUPERADMIN" | "ADMIN"; kind: "CONFIGURED" | "CUSTOMER" | "ADMIN"; version: number };

async function resolveAdminIdentity(id?: string, kind?: string): Promise<AdminIdentity | null> {
  if (!id) return null;
  if (id === protectedPrincipalId) {
    const security = await prisma.accountSecurity.findUnique({ where: { id: "main" } });
    if (security?.principalId !== id) return null;
    return { id, email: configuredAdminEmail!, name: "Conta principal", role: "SUPERADMIN", kind: "CONFIGURED", version: 0 };
  }
  if (kind !== "ADMIN") {
    const account = await prisma.customerAccount.findUnique({ where: { id } });
    if (account?.active && account.role === "ADMIN") return { id, email: account.email, name: `${account.firstName} ${account.lastName}`, role: "ADMIN", kind: "CUSTOMER", version: account.sessionVersion };
  }
  if (kind !== "CUSTOMER") {
    const account = await prisma.adminUser.findUnique({ where: { id } });
    if (account?.active) return { id, email: account.email, name: account.name, role: "ADMIN", kind: "ADMIN", version: account.sessionVersion };
  }
  return null;
}

export async function getCurrentAdmin(): Promise<AdminIdentity | null> {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, adminSessionSecret, { algorithms: ["HS256"] });
      const identity = await resolveAdminIdentity(payload.sub, payload.kind as string | undefined);
      if (identity && identity.version === (payload.version ?? 0)) return identity;
    } catch { /* Invalid/expired sessions cannot authorize an operation. */ }
  }
  // Customer sessions can authorize Admin only with the current database
  // role and version; permissions never come from editable JWT metadata.
  const customer = await getCurrentCustomer();
  return customer ? resolveAdminIdentity(customer.id, "CUSTOMER") : null;
}

export async function getCurrentCustomer() {
  const token = (await cookies()).get(customerSessionCookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, customerSessionSecret, { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    const account = await prisma.customerAccount.findUnique({ where: { id: payload.sub } });
    if (!account?.active || account.sessionVersion !== (payload.version ?? 0)) return null;
    return { id: account.id, email: account.email, firstName: account.firstName, lastName: account.lastName };
  } catch { return null; }
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireSuperadmin() {
  const admin = await requireAdmin();
  if (admin.role !== "SUPERADMIN") redirect("/admin?denied=1");
  return admin;
}

export async function validateAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  // Preserve the existing Railway mechanism and immutable authentication subject.
  if (normalizedEmail === configuredAdminEmail) {
    const configuredPassword = process.env.ADMIN_PASSWORD;
    if (configuredPassword) {
      const supplied = Buffer.from(password); const expected = Buffer.from(configuredPassword);
      if (supplied.length === expected.length && timingSafeEqual(supplied, expected)) return resolveAdminIdentity(protectedPrincipalId, "CONFIGURED");
    }
  }
  const legacy = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
  if (legacy?.active && await compare(password, legacy.passwordHash)) {
    await prisma.adminUser.update({ where: { id: legacy.id }, data: { lastLoginAt: new Date() } });
    return resolveAdminIdentity(legacy.id, "ADMIN");
  }
  const customer = await validateCustomerCredentials(normalizedEmail, password);
  return customer?.role === "ADMIN" ? resolveAdminIdentity(customer.id, "CUSTOMER") : null;
}

export async function validateCustomerCredentials(email: string, password: string) {
  const customer = await prisma.customerAccount.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!customer?.active || !customer.passwordHash || !await compare(password, customer.passwordHash)) return null;
  return prisma.customerAccount.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } });
}
