"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type WorkspaceSettingsPanelProps = {
  workspaceId: string;
  initialName: string;
  canRename: boolean;
};

export function WorkspaceSettingsPanel({
  workspaceId,
  initialName,
  canRename,
}: WorkspaceSettingsPanelProps): JSX.Element {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const saveWorkspaceName = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Workspace name cannot be empty.");
      return;
    }

    if (trimmed === initialName) {
      toast.message("No changes to save.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error || "Unable to rename workspace.");
        setSaving(false);
        return;
      }

      toast.success("Workspace renamed.");
      router.refresh();
    } catch {
      toast.error("Unable to rename workspace.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-2 text-sm font-medium">Workspace name</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={!canRename || saving}
          placeholder="Workspace name"
          maxLength={100}
        />
        <Button onClick={() => void saveWorkspaceName()} disabled={!canRename || saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
      {!canRename && (
        <p className="mt-2 text-xs text-muted-foreground">Only workspace owners can rename the workspace.</p>
      )}
    </div>
  );
}
