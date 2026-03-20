import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/dev-auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, getRequestIp } from "@/lib/rate-limit";
import { authSignupSchema } from "@/lib/validators";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = authSignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const normalizedEmail = normalizeEmail(parsed.data.email);
    const normalizedName = parsed.data.name.trim();
    const requestIp = getRequestIp(request.headers);
    const ipLimit = consumeRateLimit({
      key: `signup:ip:${requestIp}`,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });
    const emailLimit = consumeRateLimit({
      key: `signup:email:${requestIp}:${normalizedEmail}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });

    if (!ipLimit.allowed || !emailLimit.allowed) {
      return NextResponse.json({ error: "Too many signup attempts. Please try again later." }, { status: 429 });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
    }

    const passwordHash = await hash(parsed.data.password, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          passwordHash,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: `${user.name}'s Workspace`,
          ownerId: user.id,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: "OWNER",
        },
      });
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Signup failed", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
