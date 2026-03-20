import { type WorkspaceRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { ensureDemoUser, isDevAuthBypassEnabled } from "@/lib/dev-auth";
import { prisma } from "@/lib/prisma";

export const authDisabled = isDevAuthBypassEnabled();

export async function getCurrentUserId(): Promise<string | null> {
  const sessionUserId = (await getAuthSession())?.user?.id ?? null;
  if (sessionUserId) {
    return sessionUserId;
  }

  if (authDisabled) {
    return ensureDemoUser();
  }

  return null;
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
  const membership = await prisma.workspaceMember.findUnique({
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

  if (membership) {
    return membership;
  }

  if (authDisabled) {
    const demoUserId = await ensureDemoUser();
    if (userId === demoUserId) {
      return { role: "OWNER" };
    }
  }

  return null;
}

export function canEdit(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "EDITOR";
}
