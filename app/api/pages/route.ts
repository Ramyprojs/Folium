import { NextResponse } from "next/server";
import { canEdit, errorResponse, getMembership, requireUser } from "@/lib/api";
import { validatePageParentAssignment } from "@/lib/pages";
import { prisma } from "@/lib/prisma";
import { pageCreateSchema } from "@/lib/validators";

export async function GET(request: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return errorResponse("workspaceId is required", 422);
  }

  const membership = await getMembership(userId, workspaceId);
  if (!membership) {
    return errorResponse("Forbidden", 403);
  }

  const pages = await prisma.page.findMany({
    where: {
      workspaceId,
      isArchived: false,
    },
    select: {
      id: true,
      title: true,
      icon: true,
      isFavorited: true,
      isArchived: true,
      parentId: true,
      workspaceId: true,
      order: true,
    },
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });

  return NextResponse.json({ pages });
}

export async function POST(request: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const body = await request.json();
  const parsed = pageCreateSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("Invalid payload", 422);
  }

  const membership = await getMembership(userId, parsed.data.workspaceId);
  if (!membership || !canEdit(membership.role)) {
    return errorResponse("Forbidden", 403);
  }

  const parentValidation = await validatePageParentAssignment({
    parentId: parsed.data.parentId,
    workspaceId: parsed.data.workspaceId,
  });
  if (!parentValidation.ok) {
    return errorResponse(parentValidation.message, parentValidation.status);
  }

  const sibling = await prisma.page.findFirst({
    where: {
      workspaceId: parsed.data.workspaceId,
      parentId: parsed.data.parentId || null,
    },
    orderBy: {
      order: "desc",
    },
  });

  const page = await prisma.page.create({
    data: {
      workspaceId: parsed.data.workspaceId,
      parentId: parsed.data.parentId || null,
      createdById: userId,
      title: parsed.data.title,
      content: {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
      order: (sibling?.order || 0) + 1,
    },
  });

  return NextResponse.json({ page }, { status: 201 });
}
