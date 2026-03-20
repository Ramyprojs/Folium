import { type WorkspaceRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { ensureDemoUser } from "@/lib/dev-auth";
import { prisma } from "@/lib/prisma";

export const authDisabled =
  process.env.NODE_ENV !== "production" && process.env.AUTH_DISABLED !== "false";

export async function getCurrentUserId(): Promise<string | null> {
  if (authDisabled) {
    return ensureDemoUser();
  }

  return (await getAuthSession())?.user?.id ?? null;
}

export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser(): Promise<string | NextResponse> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return errorResponse("Unauthorized", 401);
  }

  return userId;
}

export async function getMembership(
  userId: string,
  workspaceId: string,
): Promise<{ role: WorkspaceRole } | null> {
  if (authDisabled) {
    return { role: "OWNER" };
  }

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
