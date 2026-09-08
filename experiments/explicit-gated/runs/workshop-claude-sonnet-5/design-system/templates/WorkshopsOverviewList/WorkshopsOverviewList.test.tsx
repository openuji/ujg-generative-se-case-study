import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { WorkshopTeaserContent } from "../../components/WorkshopTeaserContent/WorkshopTeaserContent";
import { WorkshopTeaserCard } from "../WorkshopTeaserCard/WorkshopTeaserCard";
import { WorkshopsOverviewList } from "./WorkshopsOverviewList";

afterEach(cleanup);

const teasers = [
  {
    title: "Designing accessible workshops",
    summary: "A hands-on session about inclusive facilitation.",
    date: "12 March 2026, 09:30",
    location: "Studio 2, Rotterdam"
  },
  {
    title: "Facilitating difficult conversations",
    summary: "Practise structures for high-tension group sessions.",
    date: "26 March 2026, 13:00",
    location: "Studio 1, Rotterdam"
  }
];

describe("WorkshopsOverviewList", () => {
  it("repeats only what its slot is given", () => {
    render(
      <WorkshopsOverviewList
        workshops={teasers.map((teaser) => (
          <WorkshopTeaserCard
            content={<WorkshopTeaserContent {...teaser} />}
            action={<ActionControl label="Open workshop" />}
          />
        ))}
      />
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Open workshop" })).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Designing accessible workshops" }).tagName).toBe("H3");
  });

  it("renders an empty list when the slot has no content", () => {
    render(<WorkshopsOverviewList workshops={[]} />);

    expect(screen.getByRole("list").children).toHaveLength(0);
  });
});
