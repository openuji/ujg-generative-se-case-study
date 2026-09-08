import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WaitlistFormFields } from "./WaitlistFormFields";

afterEach(cleanup);

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function submittedEntries() {
  const form = screen.getByRole("form", { name: "Waitlist details" }) as HTMLFormElement;
  return Object.fromEntries(new FormData(form));
}

describe("WaitlistFormFields", () => {
  it("submits exactly the editable properties of its data contract", () => {
    render(
      <form aria-label="Waitlist details">
        <WaitlistFormFields />
      </form>
    );

    fill("Name", "Ada Lovelace");
    fill("Email", "ada@example.org");
    fill("Notes", "Any time slot works");

    expect(submittedEntries()).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.org",
      notes: "Any time slot works"
    });
  });

  it("renders supplied values and keeps validation metadata out of the submission", () => {
    render(
      <form aria-label="Waitlist details">
        <WaitlistFormFields name="" email="not-an-address" errors={{ name: "Enter your name." }} />
      </form>
    );

    expect(screen.getByRole("alert").textContent).toBe("Enter your name.");
    expect(Object.keys(submittedEntries())).toEqual(["name", "email", "notes"]);
  });
});
