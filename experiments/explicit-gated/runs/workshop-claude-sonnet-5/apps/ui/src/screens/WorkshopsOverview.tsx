/**
 * The list of workshops on offer, and the way into one of them.
 */

import { useEffect, useState } from "react";
import { ActionControl, WorkshopTeaserCard, WorkshopTeaserContent, WorkshopsOverviewList } from "@workshop/design-system";

import { goTo } from "../navigation";
import { readWorkshops, ServiceUnreachable, type WorkshopEntry } from "../workshopService";
import { Loading, Trouble } from "./chrome";

export function WorkshopsOverview() {
  const [workshops, setWorkshops] = useState<WorkshopEntry[] | null>(null);
  const [trouble, setTrouble] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    readWorkshops()
      .then((answer) => {
        if (current) setWorkshops(answer.body.workshops);
      })
      .catch((cause: unknown) => {
        if (current) setTrouble(cause instanceof ServiceUnreachable ? cause.message : String(cause));
      });
    return () => {
      current = false;
    };
  }, []);

  if (trouble !== null) return <Trouble message={trouble} />;
  if (workshops === null) return <Loading what="the workshops" />;

  return (
    <WorkshopsOverviewList
      workshops={workshops.map((workshop) => (
        <WorkshopTeaserCard
          key={workshop.id}
          content={
            <WorkshopTeaserContent
              title={workshop.teaser.title}
              summary={workshop.teaser.summary}
              date={workshop.teaser.date}
              location={workshop.teaser.location}
            />
          }
          action={
            <ActionControl
              label="Open workshop"
              onActivate={() => goTo({ name: "workshop", workshopId: workshop.id })}
            />
          }
        />
      ))}
    />
  );
}
