import { NextResponse } from "next/server";
import { errorResponse, getMembership, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { workspacePatchSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const membership = await getMembership(userId, id);
  if (!membership) {
    return errorResponse("Forbidden", 403);
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      icon: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!workspace) {
    return errorResponse("Workspace not found", 404);
  }

  return NextResponse.json({ workspace });
}

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const membership = await getMembership(userId, id);
  if (!membership || membership.role !== "OWNER") {
    return errorResponse("Only owners can update workspace settings", 403);
  }

  const body = await request.json();
  const parsed = workspacePatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid payload", 422);
  }

  const workspace = await prisma.workspace.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ workspace });
}

export async function DELETE(_: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) {
    return errorResponse("Workspace not found", 404);
  }
  if (workspace.ownerId !== userId) {
    return errorResponse("Only owner can delete workspace", 403);
  }

  await prisma.workspace.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
