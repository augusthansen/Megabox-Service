import { prisma } from "./prisma";
import * as bcrypt from "bcryptjs";

// User role types matching Prisma schema
export type UserRole = "super_admin" | "customer_admin" | "customer_tech" | "service_tech";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function getUserByEmail(email: string) {
  if (!prisma) return null;
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  companyId?: string;
}) {
  if (!prisma) throw new Error("Database connection unavailable");
  const passwordHash = await hashPassword(data.password);
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
      companyId: data.companyId,
    },
  });
}


