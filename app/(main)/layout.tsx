import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

export default async function MainLayout({ children }: { children: React.ReactNode }): Promise<JSX.Element> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return <>{children}</>;
}
