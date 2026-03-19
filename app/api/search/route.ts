import { NextResponse } from "next/server";
import { errorResponse, getMembership, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
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
      OR: [
        {
          title: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          content: {
            path: ["content"],
            string_contains: q,
          },
        },
      ],
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 20,
  });

  return NextResponse.json({ pages });
}
