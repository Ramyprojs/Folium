import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function WorkspaceRootPage({
  params,
}: {
  params: { workspaceId: string };
}): Promise<never> {
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
        createdById: (await prisma.workspace.findUnique({ where: { id: params.workspaceId } }))!.ownerId,
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
