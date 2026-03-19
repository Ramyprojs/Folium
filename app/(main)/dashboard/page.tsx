import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Your workspaces</h1>
        <form action="/api/workspaces" method="post">
          <Button type="submit">New workspace</Button>
        </form>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {memberships.map((item) => (
          <Link
            key={item.workspaceId}
            href={`/${item.workspaceId}`}
            className="rounded-xl border bg-card p-4 transition hover:shadow-sm"
          >
            <p className="text-lg font-medium">{item.workspace.name}</p>
            <p className="text-sm text-muted-foreground">Role: {item.role}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
