"use client";

type DatabaseRow = {
  id: string;
  properties: Record<string, unknown>;
};

type TableViewProps = {
  columns: string[];
  rows: DatabaseRow[];
};

export function TableView({ columns, rows }: TableViewProps): JSX.Element {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              {columns.map((col) => (
                <td key={`${row.id}-${col}`} className="px-3 py-2">
                  {String(row.properties[col] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
