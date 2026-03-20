import { NextResponse } from "next/server";
import { errorResponse, getMembership, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params): Promise<NextResponse> {
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
  if (!membership) {
    return errorResponse("Forbidden", 403);
  }

  const children = await prisma.page.findMany({
    where: {
      parentId: id,
      isArchived: false,
    },
    orderBy: {
      order: "asc",
    },
  });

  return NextResponse.json({ children });
}
