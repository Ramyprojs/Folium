import { redirect } from "next/navigation";
import { WorkspaceSettingsPanel } from "@/components/settings/workspace-settings-panel";
import { getCurrentUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export default async function WorkspaceSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ workspaceId?: string }>;
}): Promise<JSX.Element> {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/login");
  }

  const resolvedSearchParams = (await searchParams) || {};
  const workspaceId = resolvedSearchParams.workspaceId;

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      ...(workspaceId ? { workspaceId } : {}),
    },
    include: {
      workspace: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      workspace: {
        createdAt: "asc",
      },
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold">Workspace settings</h1>
      {membership?.workspace ? (
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <WorkspaceSettingsPanel
            workspaceId={membership.workspace.id}
            initialName={membership.workspace.name}
            canRename={membership.role === "OWNER"}
          />

          <p className="text-lg font-medium">Members</p>
          <div className="space-y-2">
            {membership.workspace.members.map((member) => (
              <p key={member.id} className="text-sm">
                {member.user.name}
                {membership.role !== "VIEWER" || member.user.id === userId ? ` (${member.user.email})` : ""}
                {" • "}
                {member.role}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <p>No workspace available.</p>
      )}
    </main>
  );
}
