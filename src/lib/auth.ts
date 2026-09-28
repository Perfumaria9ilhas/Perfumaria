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
};

type CustomerSessionPayload = {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({
    email: payload.email,
    name: payload.name,
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
  const token = await new SignJWT({
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
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

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, adminSessionSecret);

    return {
      id: payload.sub,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function getCurrentCustomer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(customerSessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, customerSessionSecret);

    return {
      id: payload.sub as string,
      email: payload.email as string,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

export async function validateAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== configuredAdminEmail) return null;

  const user = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (user) {
    const isValid = await compare(password, user.passwordHash);
    if (isValid) return user;
  }

  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) return null;
  if (password !== configuredPassword) return null;
  return { id: "configured-admin", email: configuredAdminEmail, name: "Admin 9 Ilhas" };
}

export async function validateCustomerCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const customer = await prisma.customerAccount.findUnique({
    where: { email: normalizedEmail },
  });

  if (!customer?.passwordHash) {
    return null;
  }

  const isValid = await compare(password, customer.passwordHash);

  if (!isValid) {
    return null;
  }

  return customer;
}
