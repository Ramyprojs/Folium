import { NextResponse } from "next/server";
import { canEdit, errorResponse, getMembership, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { movePageSchema } from "@/lib/validators";

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const page = await prisma.page.findUnique({ where: { id: params.id } });
  if (!page) {
    return errorResponse("Page not found", 404);
  }

  const membership = await getMembership(userId, page.workspaceId);
  if (!membership || !canEdit(membership.role)) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const parsed = movePageSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid payload", 422);
  }

  if (parsed.data.parentId) {
    const parent = await prisma.page.findUnique({ where: { id: parsed.data.parentId } });
    if (!parent) {
      return errorResponse("Parent page not found", 404);
    }
    if (parent.workspaceId !== page.workspaceId) {
      return errorResponse("Cannot move page across workspaces", 403);
    }
  }

  const updated = await prisma.page.update({
    where: { id: params.id },
    data: {
      parentId: parsed.data.parentId,
      order: parsed.data.order,
    },
  });

  return NextResponse.json({ page: updated });
}
