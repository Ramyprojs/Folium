import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { errorResponse, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { databaseRowSchema } from "@/lib/validators";

type Params = { params: { id: string; rid: string } };

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const body = await request.json();
  const parsed = databaseRowSchema.partial().safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid payload", 422);
  }

  const existing = await prisma.databaseRow.findUnique({ where: { id: params.rid } });
  if (!existing || existing.databaseId !== params.id) {
    return errorResponse("Row not found", 404);
  }

  const row = await prisma.databaseRow.update({
    where: { id: params.rid },
    data: {
      ...(parsed.data.order !== undefined ? { order: parsed.data.order } : {}),
      ...(parsed.data.properties !== undefined
        ? { properties: parsed.data.properties as Prisma.InputJsonValue }
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

  await prisma.databaseRow.delete({ where: { id: params.rid } });

  return NextResponse.json({ ok: true });
}
