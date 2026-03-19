import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PublicPage({ params }: { params: { pageId: string } }): Promise<JSX.Element> {
  const page = await prisma.page.findUnique({ where: { id: params.pageId } });
  if (!page || !page.isPublic) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-4 text-4xl font-semibold">{page.title}</h1>
      <pre className="overflow-auto rounded-lg border bg-card p-4 text-sm">
        {JSON.stringify(page.content, null, 2)}
      </pre>
    </main>
  );
}
