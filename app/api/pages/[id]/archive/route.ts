import { NextResponse } from "next/server";
import { canEdit, errorResponse, getMembership, requireUser } from "@/lib/api";
import { collectPageTreeIds } from "@/lib/pages";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) {
    return errorResponse("Page not found", 404);
  }

  const membership = await getMembership(userId, page.workspaceId);
  if (!membership || !canEdit(membership.role)) {
    return errorResponse("Forbidden", 403);
  }

  const nextArchivedState = !page.isArchived;
  const ids = await collectPageTreeIds(id);

  await prisma.page.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: { isArchived: nextArchivedState },
  });

  return NextResponse.json({
    page: {
      ...page,
      isArchived: nextArchivedState,
    },
  });
}
