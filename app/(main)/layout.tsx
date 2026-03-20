import { redirect } from "next/navigation";
import { authDisabled, getCurrentUserId } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: React.ReactNode }): Promise<JSX.Element> {
  if (!authDisabled) {
    const userId = await getCurrentUserId();
    if (!userId) {
      redirect("/login");
    }
  }

  return <>{children}</>;
}
