import {
  WorkshopsOverviewList,
  WorkshopTeaserCard,
  WorkshopTeaserContent,
  ActionControl
} from "@workshop-claude-sonnet/design-system";
import { listWorkshops } from "../api";
import { useAsyncData } from "../useAsyncData";
import { useNavigate } from "../router";

export function WorkshopsPage() {
  const [state] = useAsyncData(listWorkshops, []);
  const navigate = useNavigate();

  if (state.status === "loading") return <p className="p-6 text-ink-muted">Loading workshops…</p>;
  if (state.status === "error") return <p className="p-6 text-error-ink">Could not load workshops.</p>;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Workshops</h1>
        <p className="text-ink-muted">Browse upcoming sessions and register.</p>
      </div>
      <WorkshopsOverviewList
        overviewWorkshops={state.data.map((workshop) => (
          <WorkshopTeaserCard
            key={workshop.id}
            teaserContent={
              <WorkshopTeaserContent
                title={workshop.title}
                summary={workshop.summary}
                date={workshop.date}
                location={workshop.location}
              />
            }
            teaserAction={
              <ActionControl label="Open workshop" onAction={() => navigate(`/workshops/${workshop.id}`)} />
            }
          />
        ))}
      />
    </div>
  );
}
