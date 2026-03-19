"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ShareModalProps = {
  pageId: string;
  isPublic: boolean;
  onClose: () => void;
};

export function ShareModal({ pageId, isPublic, onClose }: ShareModalProps): JSX.Element {
  const [publicState, setPublicState] = useState(isPublic);

  const shareUrl = `${window.location.origin}/share/${pageId}`;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Share page</h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={async () => {
                const res = await fetch(`/api/pages/${pageId}/share`, { method: "PATCH" });
                if (res.ok) {
                  const data = await res.json();
                  setPublicState(data.page.isPublic);
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
              if (!publicState) return;
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
