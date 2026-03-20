import { WorkspacePageClient } from "@/components/pages/workspace-page";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string; pageId: string }>;
}): Promise<JSX.Element> {
  const { workspaceId, pageId } = await params;

  return <WorkspacePageClient workspaceId={workspaceId} pageId={pageId} />;
}
