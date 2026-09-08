export interface DefinitionListItem {
  term: string;
  value: string;
}

export interface DefinitionListProps {
  items: DefinitionListItem[];
}

export function DefinitionList({ items }: DefinitionListProps) {
  return (
    <dl className="divide-y divide-line text-sm">
      {items.map((item) => (
        <div className="flex items-center justify-between gap-4 py-2" key={item.term}>
          <dt className="text-ink-muted">{item.term}</dt>
          <dd className="font-medium text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
