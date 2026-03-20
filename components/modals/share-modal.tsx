"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ShareModalProps = {
  pageId: string;
  isPublic: boolean;
  onClose: () => void;
};

export function ShareModal({ pageId, isPublic, onClose }: ShareModalProps): JSX.Element {
  const [publicState, setPublicState] = useState(isPublic);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/share/${pageId}`;
  }, [pageId]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <div className="space-y-4">
          <DialogTitle className="text-lg font-semibold">Share page</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Enable a public link when you want to publish this page outside your workspace.
          </DialogDescription>
          <div className="flex items-center gap-2">
            <Button
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true);
                try {
                  const res = await fetch(`/api/pages/${pageId}/share`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isPublic: !publicState }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setPublicState(data.page.isPublic);
                    await queryClient.invalidateQueries({ queryKey: ["page", pageId] });
                    await queryClient.invalidateQueries({ queryKey: ["pages"] });
                  }
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {publicState ? "Disable public link" : "Enable public link"}
            </Button>
          </div>
          <Input readOnly value={publicState ? shareUrl : "Public link disabled"} />
          <Button
            variant="outline"
            onClick={async () => {
              if (!publicState || !shareUrl) return;
              await navigator.clipboard.writeText(shareUrl);
            }}
          >
            Copy link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
