import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { canEdit, errorResponse, getMembership, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { commentSchema, resolveCommentSchema } from "@/lib/validators";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const page = await prisma.page.findUnique({ where: { id: params.id } });
  if (!page) {
    return errorResponse("Page not found", 404);
  }

  const membership = await getMembership(userId, page.workspaceId);
  if (!membership) {
    return errorResponse("Forbidden", 403);
  }

  const comments = await prisma.comment.findMany({
    where: {
      pageId: params.id,
      parentId: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ comments });
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
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
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid payload", 422);
  }

  if (parsed.data.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parsed.data.parentId },
      select: {
        id: true,
        pageId: true,
      },
    });

    if (!parent || parent.pageId !== params.id) {
      return errorResponse("Parent comment does not belong to this page", 422);
    }
  }

  const comment = await prisma.comment.create({
    data: {
      pageId: params.id,
      userId,
      content: parsed.data.content,
      parentId: parsed.data.parentId,
      selection: (parsed.data.selection || Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const existing = await prisma.comment.findUnique({
    where: { id: params.id },
    include: { page: true },
  });
  if (!existing) {
    return errorResponse("Comment not found", 404);
  }

  const membership = await getMembership(userId, existing.page.workspaceId);
  if (!membership || !canEdit(membership.role)) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const parsed = resolveCommentSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid payload", 422);
  }

  const comment = await prisma.comment.update({
    where: { id: params.id },
    data: {
      resolvedAt: parsed.data.resolved ? new Date() : null,
    },
  });

  return NextResponse.json({ comment });
}

export async function DELETE(_: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const existing = await prisma.comment.findUnique({
    where: { id: params.id },
    include: { page: true },
  });
  if (!existing) {
    return errorResponse("Comment not found", 404);
  }

  const membership = await getMembership(userId, existing.page.workspaceId);
  if (!membership || !canEdit(membership.role)) {
    return errorResponse("Forbidden", 403);
  }

  await prisma.comment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
