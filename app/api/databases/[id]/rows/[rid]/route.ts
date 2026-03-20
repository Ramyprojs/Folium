import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { canEdit, errorResponse, getMembership, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { databaseRowSchema } from "@/lib/validators";

type Params = { params: { id: string; rid: string } };

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return errorResponse("Invalid JSON body", 400);
  }
  const parsed = databaseRowSchema.partial().safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid payload", 422);
  }

  const existing = await prisma.databaseRow.findUnique({ where: { id: params.rid } });
  if (!existing || existing.databaseId !== params.id) {
    return errorResponse("Row not found", 404);
  }

  const database = await prisma.database.findUnique({
    where: { id: params.id },
    include: { page: true },
  });
  if (!database) {
    return errorResponse("Database not found", 404);
  }

  const membership = await getMembership(userId, database.page.workspaceId);
  if (!membership || !canEdit(membership.role)) {
    return errorResponse("Forbidden", 403);
  }

  const row = await prisma.databaseRow.update({
    where: { id: params.rid },
    data: {
      ...(parsed.data.order !== undefined ? { order: parsed.data.order } : {}),
      ...(parsed.data.properties !== undefined
        ? {
            properties: {
              ...(typeof existing.properties === "object" && existing.properties ? (existing.properties as Record<string, unknown>) : {}),
              ...parsed.data.properties,
            } as Prisma.InputJsonValue,
          }
        : {}),
    },
  });

  return NextResponse.json({ row });
}

export async function DELETE(_: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const existing = await prisma.databaseRow.findUnique({ where: { id: params.rid } });
  if (!existing || existing.databaseId !== params.id) {
    return errorResponse("Row not found", 404);
  }

  const database = await prisma.database.findUnique({
    where: { id: params.id },
    include: { page: true },
  });
  if (!database) {
    return errorResponse("Database not found", 404);
  }

  const membership = await getMembership(userId, database.page.workspaceId);
  if (!membership || !canEdit(membership.role)) {
    return errorResponse("Forbidden", 403);
  }

  await prisma.databaseRow.delete({ where: { id: params.rid } });

  return NextResponse.json({ ok: true });
}
