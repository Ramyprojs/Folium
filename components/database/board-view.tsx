"use client";

type BoardViewProps = {
  groups: Array<{ name: string; count: number }>;
};

export function BoardView({ groups }: BoardViewProps): JSX.Element {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {groups.map((group) => (
        <div key={group.name} className="rounded-lg border bg-card p-3">
          <p className="text-sm font-medium">{group.name}</p>
          <p className="text-xs text-muted-foreground">{group.count} items</p>
        </div>
      ))}
    </div>
  );
}
