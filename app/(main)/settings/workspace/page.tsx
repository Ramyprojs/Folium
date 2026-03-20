import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export default async function WorkspaceSettingsPage(): Promise<JSX.Element> {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/login");
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: {
      workspace: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold">Workspace settings</h1>
      {membership?.workspace ? (
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <p className="text-lg font-medium">{membership.workspace.name}</p>
          <div className="space-y-2">
            {membership.workspace.members.map((member) => (
              <p key={member.id} className="text-sm">
                {member.user.name} ({member.user.email}) • {member.role}
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
