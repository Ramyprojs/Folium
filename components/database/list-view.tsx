"use client";

type ListViewProps = {
  rows: Array<{ id: string; label: string }>;
};

export function ListView({ rows }: ListViewProps): JSX.Element {
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="rounded-md border bg-card px-3 py-2 text-sm">
          {row.label}
        </div>
      ))}
    </div>
  );
}
