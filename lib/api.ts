import { type WorkspaceRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser(): Promise<string | NextResponse> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return errorResponse("Unauthorized", 401);
  }

  return session.user.id;
}

export async function getMembership(
  userId: string,
  workspaceId: string,
): Promise<{ role: WorkspaceRole } | null> {
  return prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    select: {
      role: true,
    },
  });
}

export function canEdit(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "EDITOR";
}
