import { NextResponse } from "next/server";
import { canEdit, errorResponse, getMembership, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { inviteMemberSchema } from "@/lib/validators";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const membership = await getMembership(userId, params.id);
  if (!membership) {
    return errorResponse("Forbidden", 403);
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  return NextResponse.json({ members });
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const membership = await getMembership(userId, params.id);
  if (!membership || !canEdit(membership.role)) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid payload", 422);
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return errorResponse("User does not exist", 404);
  }

  const member = await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: params.id,
      },
    },
    update: {
      role: parsed.data.role,
    },
    create: {
      userId: user.id,
      workspaceId: params.id,
      role: parsed.data.role,
    },
  });

  return NextResponse.json({ member }, { status: 201 });
}

export async function DELETE(request: Request, { params }: Params): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const membership = await getMembership(userId, params.id);
  if (!membership || membership.role !== "OWNER") {
    return errorResponse("Only owner can remove members", 403);
  }

  const { memberId } = (await request.json()) as { memberId?: string };
  if (!memberId) {
    return errorResponse("memberId is required", 422);
  }

  await prisma.workspaceMember.delete({
    where: {
      id: memberId,
    },
  });

  return NextResponse.json({ ok: true });
}
