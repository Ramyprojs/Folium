import { redirect } from "next/navigation";

export default async function HomePage(): Promise<never> {
  redirect("/dashboard");
}
