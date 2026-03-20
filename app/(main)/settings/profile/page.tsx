import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export default async function ProfileSettingsPage(): Promise<JSX.Element> {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold">Profile settings</h1>
      <div className="space-y-2 rounded-lg border bg-card p-4">
        <p>Name: {user?.name}</p>
        <p>Email: {user?.email}</p>
      </div>
    </main>
  );
}
