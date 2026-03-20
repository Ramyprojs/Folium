import { NextResponse } from "next/server";
import { canEdit, errorResponse, getMembership, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

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

  const body = (await request.json().catch(() => ({}))) as { isPublic?: boolean };
  const nextIsPublic = typeof body.isPublic === "boolean" ? body.isPublic : !page.isPublic;

  const updated = await prisma.page.update({
    where: { id: params.id },
    data: { isPublic: nextIsPublic },
  });

  return NextResponse.json({ page: updated });
}
