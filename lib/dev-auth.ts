import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@local.dev";

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

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    const workspace = await prisma.workspace.create({
      data: {
        name: "Demo Workspace",
        ownerId: user.id,
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: "OWNER",
      },
    });
  }

  return user.id;
}
