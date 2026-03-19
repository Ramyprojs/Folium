import Link from "next/link";
import { ensureDemoUser } from "@/lib/dev-auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function DashboardPage(): Promise<JSX.Element> {
  const userId = await ensureDemoUser();

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
  });

  return (
    <main className="min-h-screen bg-[#f7f6f3] dark:bg-[#161514]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Workspace Hub</h1>
            <p className="mt-1 text-sm text-muted-foreground">Open a workspace and continue writing.</p>
          </div>
          <form action="/api/workspaces" method="post">
            <Button type="submit" className="bg-[#2f2f2f] text-white hover:bg-[#1f1f1f] dark:bg-[#f3f3f3] dark:text-black">
              New workspace
            </Button>
          </form>
        </div>

        <div className="rounded-xl border bg-background p-3 shadow-sm">
          <div className="mb-2 px-2 text-xs uppercase tracking-wide text-muted-foreground">Your workspaces</div>
          <div className="grid gap-2">
            {memberships.map((item) => (
              <Link
                key={item.workspaceId}
                href={`/${item.workspaceId}`}
                className="group flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent"
              >
                <div>
                  <p className="text-sm font-medium">{item.workspace.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role.toLowerCase()}</p>
                </div>
                <span className="text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100">Open</span>
              </Link>
            ))}
          </div>
          {memberships.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground">Create your first workspace to begin.</p>
          )}
        </div>
      </div>
    </main>
  );
}
