import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage(): Promise<never> {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  redirect("/dashboard");
}
