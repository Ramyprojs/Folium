import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import {
  TEST_ADMIN_EMAIL,
  ensureTestAdminUser,
  isDevAuthBypassEnabled,
  normalizeEmail,
  normalizeDevLoginIdentifier,
} from "@/lib/dev-auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, getRequestIp, resetRateLimit } from "@/lib/rate-limit";

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is required in production");
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const normalizedEmail = normalizeDevLoginIdentifier(credentials.email);
        const requestIp = getRequestIp(req.headers ?? {});
        const ipKey = `login:ip:${requestIp}`;
        const credentialKey = `login:credential:${requestIp}:${normalizedEmail}`;
        const devAuthBypassEnabled = isDevAuthBypassEnabled();

        const ipLimit = consumeRateLimit({
          key: ipKey,
          limit: 40,
          windowMs: 10 * 60 * 1000,
        });
        const credentialLimit = consumeRateLimit({
          key: credentialKey,
          limit: 10,
          windowMs: 10 * 60 * 1000,
        });

        if (!ipLimit.allowed || !credentialLimit.allowed) {
          return null;
        }

        if (normalizedEmail === TEST_ADMIN_EMAIL && !devAuthBypassEnabled) {
          return null;
        }

        if (devAuthBypassEnabled && normalizedEmail === TEST_ADMIN_EMAIL) {
          await ensureTestAdminUser();
        }

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user?.passwordHash) {
          return null;
        }

        const valid = await compare(credentials.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        resetRateLimit(credentialKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar ?? user.image,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const normalizedEmail = normalizeEmail(user.email || "");
      const updateData: { email?: string; avatar?: string } = {};

      if (normalizedEmail && normalizedEmail !== user.email) {
        updateData.email = normalizedEmail;
      }

      if (user.image) {
        updateData.avatar = user.image;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }

      const existingMembership = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });

      if (existingMembership) {
        return;
      }

      await prisma.$transaction(async (tx) => {
        const workspace = await tx.workspace.create({
          data: {
            name: `${user.name || "New User"}'s Workspace`,
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
    },
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}
