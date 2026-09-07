import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { StatusNotice } from "../components/StatusNotice/StatusNotice";
import { WorkshopDetailSummary } from "../components/WorkshopDetailSummary/WorkshopDetailSummary";
import { DetailWithNotice } from "../templates/DetailWithNotice/DetailWithNotice";

afterEach(cleanup);

test("detail notice keeps the workshop detail primary without duplicating status details", () => {
  render(
    <DetailWithNotice
      summary={
        <WorkshopDetailSummary
          availability="Already waitlisted"
          date="18 October"
          description="The workshop is currently full, but waitlist places can still be requested."
          location="Berlin studio"
          title="Facilitation Practice"
        />
      }
      notice={<StatusNotice message="You are already on the waitlist for this workshop." tone="info" />}
    />
  );

  const title = screen.getByRole("heading", { name: "Facilitation Practice" });
  const notice = screen.getByText("You are already on the waitlist for this workshop.");

  expect(title.compareDocumentPosition(notice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getAllByText("Facilitation Practice")).toHaveLength(1);
  expect(screen.queryByRole("heading", { name: "Already waitlisted" })).toBeNull();
  expect(screen.queryByText("Workshop")).toBeNull();
});
