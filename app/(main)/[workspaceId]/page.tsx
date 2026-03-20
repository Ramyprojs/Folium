import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export default async function WorkspaceRootPage({
  params,
}: {
  params: { workspaceId: string };
}): Promise<never> {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: params.workspaceId,
      },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const first = await prisma.page.findFirst({
    where: {
      workspaceId: params.workspaceId,
      isArchived: false,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!first) {
    const created = await prisma.page.create({
      data: {
        workspaceId: params.workspaceId,
        createdById: userId,
        title: "Getting started",
        content: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Welcome to your workspace." }] }],
        },
      },
    });
    redirect(`/${params.workspaceId}/${created.id}`);
  }

  redirect(`/${params.workspaceId}/${first.id}`);
}
