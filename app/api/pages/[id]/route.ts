import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { canEdit, errorResponse, getMembership, requireUser } from "@/lib/api";
import { validatePageParentAssignment } from "@/lib/pages";
import { prisma } from "@/lib/prisma";
import { pagePatchSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      children: {
        where: { isArchived: false },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!page) {
    return errorResponse("Page not found", 404);
  }

  const membership = await getMembership(userId, page.workspaceId);
  if (!membership && !page.isPublic) {
    return errorResponse("Forbidden", 403);
  }

  return NextResponse.json({ page });
}

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const body = await request.json();
  const parsed = pagePatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid payload", 422);
  }

  const current = await prisma.page.findUnique({ where: { id } });
  if (!current) {
    return errorResponse("Page not found", 404);
  }

  const membership = await getMembership(userId, current.workspaceId);
  if (!membership || !canEdit(membership.role)) {
    return errorResponse("Forbidden", 403);
  }

  const parentValidation = await validatePageParentAssignment({
    pageId: id,
    parentId: parsed.data.parentId,
    workspaceId: current.workspaceId,
  });
  if (!parentValidation.ok) {
    return errorResponse(parentValidation.message, parentValidation.status);
  }

  const updateData: Prisma.PageUncheckedUpdateInput = {
    ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
    ...(parsed.data.icon !== undefined ? { icon: parsed.data.icon } : {}),
    ...(parsed.data.coverImage !== undefined ? { coverImage: parsed.data.coverImage } : {}),
    ...(parsed.data.parentId !== undefined ? { parentId: parsed.data.parentId } : {}),
    ...(parsed.data.content !== undefined
      ? { content: parsed.data.content as Prisma.InputJsonValue }
      : {}),
    ...(parsed.data.isFavorited !== undefined ? { isFavorited: parsed.data.isFavorited } : {}),
    ...(parsed.data.isArchived !== undefined ? { isArchived: parsed.data.isArchived } : {}),
    ...(parsed.data.fullWidth !== undefined ? { fullWidth: parsed.data.fullWidth } : {}),
  };

  if (parsed.data.isPublic !== undefined) {
    if (membership.role !== "OWNER") {
      return errorResponse("Only workspace owners can change public sharing", 403);
    }

    updateData.isPublic = parsed.data.isPublic;
  }

  const page = await prisma.page.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ page });
}

export async function DELETE(_: Request, { params }: Params): Promise<NextResponse> {
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

  await prisma.page.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
