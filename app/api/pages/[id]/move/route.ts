import { NextResponse } from "next/server";
import { canEdit, errorResponse, getMembership, requireUser } from "@/lib/api";
import { validatePageParentAssignment } from "@/lib/pages";
import { prisma } from "@/lib/prisma";
import { movePageSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
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

  const body = await request.json();
  const parsed = movePageSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid payload", 422);
  }

  const parentValidation = await validatePageParentAssignment({
    pageId: id,
    parentId: parsed.data.parentId,
    workspaceId: page.workspaceId,
  });
  if (!parentValidation.ok) {
    return errorResponse(parentValidation.message, parentValidation.status);
  }

  const updated = await prisma.page.update({
    where: { id },
    data: {
      parentId: parsed.data.parentId,
      order: parsed.data.order,
    },
  });

  return NextResponse.json({ page: updated });
}
