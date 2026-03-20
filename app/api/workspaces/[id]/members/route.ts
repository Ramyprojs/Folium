import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/dev-auth";
import { errorResponse, getMembership, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { inviteMemberSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const membership = await getMembership(userId, id);
  if (!membership) {
    return errorResponse("Forbidden", 403);
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: id },
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

  return NextResponse.json({
    members: members.map((member) => ({
      ...member,
      user: {
        ...member.user,
        email: membership.role === "VIEWER" && member.user.id !== userId ? null : member.user.email,
      },
    })),
  });
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const membership = await getMembership(userId, id);
  if (!membership || membership.role !== "OWNER") {
    return errorResponse("Only owners can manage members", 403);
  }

  const body = await request.json();
  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid payload", 422);
  }

  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(parsed.data.email) } });
  if (!user) {
    return errorResponse("User does not exist", 404);
  }

  const member = await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: id,
      },
    },
    update: {
      role: parsed.data.role,
    },
    create: {
      userId: user.id,
      workspaceId: id,
      role: parsed.data.role,
    },
  });

  return NextResponse.json({ member }, { status: 201 });
}

export async function DELETE(request: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const membership = await getMembership(userId, id);
  if (!membership || membership.role !== "OWNER") {
    return errorResponse("Only owner can remove members", 403);
  }

  const { memberId } = (await request.json()) as { memberId?: string };
  if (!memberId) {
    return errorResponse("memberId is required", 422);
  }

  const existingMember = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      workspaceId: true,
      role: true,
    },
  });

  if (!existingMember || existingMember.workspaceId !== id) {
    return errorResponse("Member not found", 404);
  }

  if (existingMember.role === "OWNER") {
    return errorResponse("Use a dedicated ownership transfer flow to change owners", 422);
  }

  await prisma.workspaceMember.delete({
    where: {
      id: existingMember.id,
    },
  });

  return NextResponse.json({ ok: true });
}
