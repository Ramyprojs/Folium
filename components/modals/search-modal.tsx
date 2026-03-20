"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type SearchModalProps = {
  workspaceId: string;
  onClose: () => void;
};

type SearchResult = {
  id: string;
  title: string;
};

export function SearchModal({ workspaceId, onClose }: SearchModalProps): JSX.Element {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.pages || []);
      }
    };
    void run();
  }, [q, workspaceId]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <div className="space-y-3">
          <DialogTitle className="text-lg font-semibold">Search workspace</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Search pages in the current workspace by title and content.
          </DialogDescription>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages..." />
          <div className="max-h-[360px] space-y-1 overflow-y-auto">
            {results.map((item) => (
              <Link
                key={item.id}
                className="block rounded-md border p-2 text-sm hover:bg-accent"
                href={`/${workspaceId}/${item.id}`}
                onClick={onClose}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
