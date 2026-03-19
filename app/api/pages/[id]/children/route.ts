import { NextResponse } from "next/server";
import { errorResponse, getMembership, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

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

  const children = await prisma.page.findMany({
    where: {
      parentId: params.id,
      isArchived: false,
    },
    orderBy: {
      order: "asc",
    },
  });

  return NextResponse.json({ children });
}
