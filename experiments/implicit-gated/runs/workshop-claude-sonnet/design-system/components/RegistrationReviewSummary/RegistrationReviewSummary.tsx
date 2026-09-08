import { DefinitionList } from "../../primitives/DefinitionList/DefinitionList";

export interface RegistrationReviewSummaryProps {
  workshopTitle: string;
  name: string;
  email: string;
}

export function RegistrationReviewSummary({ workshopTitle, name, email }: RegistrationReviewSummaryProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-ink">{workshopTitle}</h2>
      <DefinitionList
        items={[
          { term: "Name", value: name },
          { term: "Email", value: email }
        ]}
      />
    </div>
  );
}
