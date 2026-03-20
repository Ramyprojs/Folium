import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@local.dev";
export const TEST_ADMIN_EMAIL = "admin@local.dev";
export const TEST_ADMIN_LOGIN = "admin";
export const TEST_ADMIN_PASSWORD = "admin";

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isDevAuthBypassEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.AUTH_DISABLED === "true";
}

async function ensureOwnerWorkspace(userId: string, workspaceName: string): Promise<void> {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (membership) {
    return;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: workspaceName,
      ownerId: userId,
    },
  });

  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId,
      role: "OWNER",
    },
  });
}

export async function ensureDemoUser(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: "Demo User",
      passwordHash: "disabled-auth",
    },
  });

  await ensureOwnerWorkspace(user.id, "Demo Workspace");

  return user.id;
}

export async function ensureTestAdminUser(): Promise<string> {
  const existingUser = await prisma.user.findUnique({
    where: { email: TEST_ADMIN_EMAIL },
    select: {
      id: true,
      passwordHash: true,
      name: true,
    },
  });

  let userId = existingUser?.id;

  if (!existingUser) {
    const passwordHash = await hash(TEST_ADMIN_PASSWORD, 10);
    const createdUser = await prisma.user.create({
      data: {
        email: TEST_ADMIN_EMAIL,
        name: "Admin",
        passwordHash,
      },
      select: {
        id: true,
      },
    });
    userId = createdUser.id;
  } else if (existingUser.passwordHash === null || existingUser.name !== "Admin") {
    const passwordHash =
      existingUser.passwordHash ?? (await hash(TEST_ADMIN_PASSWORD, 10));

    const updatedUser = await prisma.user.update({
      where: { email: TEST_ADMIN_EMAIL },
      data: {
        name: "Admin",
        passwordHash,
      },
      select: {
        id: true,
      },
    });
    userId = updatedUser.id;
  }

  if (!userId) {
    throw new Error("Failed to create the test admin user");
  }

  await ensureOwnerWorkspace(userId, "Admin Workspace");

  return userId;
}

export function normalizeDevLoginIdentifier(value: string): string {
  const normalizedValue = normalizeEmail(value);

  if (normalizedValue === TEST_ADMIN_LOGIN) {
    return TEST_ADMIN_EMAIL;
  }

  return normalizedValue;
}
