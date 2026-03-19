import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authSignupSchema } from "@/lib/validators";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = authSignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
    }

    const passwordHash = await hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: `${user.name}'s Workspace`,
        ownerId: user.id,
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: "OWNER",
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Signup failed", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
