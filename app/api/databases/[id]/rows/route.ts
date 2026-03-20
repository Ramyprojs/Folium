import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { canEdit, errorResponse, getMembership, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { databaseRowSchema } from "@/lib/validators";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const database = await prisma.database.findUnique({
    where: { id: params.id },
    include: { page: true },
  });

  if (!database) {
    return errorResponse("Database not found", 404);
  }

  const membership = await getMembership(userId, database.page.workspaceId);
  if (!membership) {
    return errorResponse("Forbidden", 403);
  }

  const rows = await prisma.databaseRow.findMany({
    where: { databaseId: params.id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ rows, schema: database.schema });
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
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

  const body = await request.json().catch(() => null);
  if (!body) {
    return errorResponse("Invalid JSON body", 400);
  }
  const parsed = databaseRowSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid payload", 422);
  }

  const last = await prisma.databaseRow.findFirst({
    where: { databaseId: params.id },
    orderBy: { order: "desc" },
  });

  const row = await prisma.databaseRow.create({
    data: {
      databaseId: params.id,
      properties: parsed.data.properties as Prisma.InputJsonValue,
      order: parsed.data.order ?? (last?.order || 0) + 1,
    },
  });

  return NextResponse.json({ row }, { status: 201 });
}
