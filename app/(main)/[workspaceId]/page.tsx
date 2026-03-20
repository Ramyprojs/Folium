import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export default async function WorkspaceRootPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}): Promise<never> {
  const { workspaceId } = await params;
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const firstTopLevelPage = await prisma.page.findFirst({
    where: {
      workspaceId,
      isArchived: false,
      parentId: null,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "asc" }],
  });

  const firstPage =
    firstTopLevelPage ||
    (await prisma.page.findFirst({
      where: {
        workspaceId,
        isArchived: false,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "asc" }],
    }));

  if (!firstPage) {
    const created = await prisma.page.create({
      data: {
        workspaceId,
        createdById: userId,
        title: "Getting started",
        content: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Welcome to your workspace." }] }],
        },
      },
    });
    redirect(`/${workspaceId}/${created.id}`);
  }

  redirect(`/${workspaceId}/${firstPage.id}`);
}
