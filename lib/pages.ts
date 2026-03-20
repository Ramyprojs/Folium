import { prisma } from "@/lib/prisma";

type ParentValidationResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      status: number;
    };

export async function validatePageParentAssignment({
  pageId,
  parentId,
  workspaceId,
}: {
  pageId?: string;
  parentId?: string | null;
  workspaceId: string;
}): Promise<ParentValidationResult> {
  if (!parentId) {
    return { ok: true };
  }

  if (pageId && parentId === pageId) {
    return {
      ok: false,
      message: "A page cannot be its own parent",
      status: 422,
    };
  }

  const parent = await prisma.page.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      parentId: true,
      workspaceId: true,
    },
  });

  if (!parent) {
    return {
      ok: false,
      message: "Parent page not found",
      status: 404,
    };
  }

  if (parent.workspaceId !== workspaceId) {
    return {
      ok: false,
      message: "Cannot move page across workspaces",
      status: 403,
    };
  }

  let ancestorId = parent.parentId;
  while (ancestorId) {
    if (pageId && ancestorId === pageId) {
      return {
        ok: false,
        message: "Cannot move a page into one of its descendants",
        status: 422,
      };
    }

    const ancestor = await prisma.page.findUnique({
      where: { id: ancestorId },
      select: { parentId: true },
    });

    ancestorId = ancestor?.parentId ?? null;
  }

  return { ok: true };
}

export async function collectPageTreeIds(rootPageId: string): Promise<string[]> {
  const ids = [rootPageId];
  let frontier = [rootPageId];

  while (frontier.length > 0) {
    const children = await prisma.page.findMany({
      where: {
        parentId: {
          in: frontier,
        },
      },
      select: { id: true },
    });

    frontier = children.map((child) => child.id);
    ids.push(...frontier);
  }

  return ids;
}
