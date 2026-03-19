"use client";

type GalleryItem = {
  id: string;
  title: string;
  cover?: string;
};

type GalleryViewProps = {
  items: GalleryItem[];
};

export function GalleryView({ items }: GalleryViewProps): JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-lg border bg-card">
          <div className="h-28 bg-muted" style={item.cover ? { backgroundImage: `url(${item.cover})`, backgroundSize: "cover" } : undefined} />
          <div className="p-3 text-sm font-medium">{item.title}</div>
        </div>
      ))}
    </div>
  );
}
