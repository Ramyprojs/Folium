import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

const authDisabled =
  process.env.AUTH_DISABLED === "true" ||
  (process.env.NODE_ENV !== "production" && process.env.AUTH_DISABLED !== "false");

export default async function MainLayout({ children }: { children: React.ReactNode }): Promise<JSX.Element> {
  if (!authDisabled) {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      redirect("/login");
    }
  }

  return <>{children}</>;
}
