import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const sessionCookieName = "nineilhas_admin_session";
const customerSessionCookieName = "nineilhas_customer_session";
const sessionSecret = new TextEncoder().encode(
  process.env.ADMIN_SESSION_SECRET ?? "troca-esta-chave-por-uma-chave-segura",
);

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

const sharedAdminPassword = process.env.ADMIN_SHARED_PASSWORD ?? "Casafeliz";
const sharedAdminAccounts = [
  {
    id: "shared-admin-perfumaria9ilhas",
    email: "perfumaria9ilhas@hotmail.com",
    name: "Admin 9 Ilhas",
  },
  {
    id: "shared-admin-d3agl3z0r123",
    email: "d3agl3z0r123@gmail.com",
    name: "Admin 9 Ilhas",
  },
];

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(sessionSecret);

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
    .sign(sessionSecret);

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
    const { payload } = await jwtVerify(token, sessionSecret);

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
    const { payload } = await jwtVerify(token, sessionSecret);

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

  const sharedAdmin = sharedAdminAccounts.find((account) => account.email === normalizedEmail);

  if (sharedAdmin && password === sharedAdminPassword) {
    return sharedAdmin;
  }

  const user = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return null;
  }

  const isValid = await compare(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  return user;
}

export async function validateCustomerCredentials(email: string, password: string) {
  const customer = await prisma.customerAccount.findUnique({
    where: { email },
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
