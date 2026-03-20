import { NextResponse } from "next/server";
import { errorResponse, getMembership, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

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
  if (!membership || membership.role !== "OWNER") {
    return errorResponse("Only workspace owners can change public sharing", 403);
  }

  const body = (await request.json().catch(() => ({}))) as { isPublic?: boolean };
  const nextIsPublic = typeof body.isPublic === "boolean" ? body.isPublic : !page.isPublic;

  const updated = await prisma.page.update({
    where: { id },
    data: { isPublic: nextIsPublic },
  });

  return NextResponse.json({ page: updated });
}
