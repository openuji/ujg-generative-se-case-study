export type DescriptionTerm = {
  term: string;
  value: string;
};

export type DescriptionListProps = {
  terms: DescriptionTerm[];
};

export function DescriptionList({ terms }: DescriptionListProps) {
  return (
    <dl>
      {terms.map((item) => (
        <div key={item.term}>
          <dt>{item.term}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
