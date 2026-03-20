import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireUser } from "@/lib/api";
import { workspaceCreateSchema } from "@/lib/validators";

export async function GET(): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const workspaces = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          _count: {
            select: { pages: true, members: true },
          },
        },
      },
    },
    orderBy: { workspace: { createdAt: "asc" } },
  });

  return NextResponse.json({
    workspaces: workspaces.map((entry) => ({
      ...entry.workspace,
      role: entry.role,
    })),
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  let payload: Record<string, unknown> = {};
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    payload = (await request.json()) as Record<string, unknown>;
  } else if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    payload = {
      name: String(formData.get("name") || "New Workspace"),
      icon: formData.get("icon") ? String(formData.get("icon")) : undefined,
    };
  } else {
    payload = { name: "New Workspace" };
  }

  const parsed = workspaceCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("Invalid payload", 422);
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      icon: parsed.data.icon,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
  });

  return NextResponse.json({ workspace }, { status: 201 });
}
