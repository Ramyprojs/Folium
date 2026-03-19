import { NextResponse } from "next/server";
import { canEdit, errorResponse, getMembership, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { workspacePatchSchema } from "@/lib/validators";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const membership = await getMembership(userId, params.id);
  if (!membership) {
    return errorResponse("Forbidden", 403);
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (!workspace) {
    return errorResponse("Workspace not found", 404);
  }

  return NextResponse.json({ workspace });
}

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const membership = await getMembership(userId, params.id);
  if (!membership || !canEdit(membership.role)) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const parsed = workspacePatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid payload", 422);
  }

  const workspace = await prisma.workspace.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ workspace });
}

export async function DELETE(_: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: params.id } });
  if (!workspace) {
    return errorResponse("Workspace not found", 404);
  }
  if (workspace.ownerId !== userId) {
    return errorResponse("Only owner can delete workspace", 403);
  }

  await prisma.workspace.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
