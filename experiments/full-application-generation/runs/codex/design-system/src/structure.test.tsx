import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ActionControl,
  FormWithSubmitAction,
  RegistrationFormFields,
  WaitlistFormFields,
  WorkshopTeaserContent
} from "./index";

describe("workshop design-system artifacts", () => {
  it("renders content and controls", () => {
    render(
      <div>
        <WorkshopTeaserContent title="Data Storytelling" summary="Practical narrative techniques." date="Wed, Jun 11, 2025" location="Virtual" />
        <ActionControl label="View workshop" />
      </div>
    );
    expect(screen.getByText("Data Storytelling")).toBeTruthy();
    expect(screen.getByRole("button", { name: /View workshop/ })).toBeTruthy();
  });

  it("serializes registration fields with the editable schema keys", () => {
    const { container } = render(
      <FormWithSubmitAction
        formFields={<RegistrationFormFields name="Alex Morgan" email="alex.morgan@example.com" accessibilityNotes="Advance materials requested." />}
        formSubmitAction={<ActionControl label="Continue" type="submit" />}
      />
    );
    const form = container.querySelector("form");
    expect(form).toBeTruthy();
    expect(Object.fromEntries(new FormData(form as HTMLFormElement))).toEqual({
      name: "Alex Morgan",
      email: "alex.morgan@example.com",
      accessibilityNotes: "Advance materials requested."
    });
  });

  it("serializes waitlist fields with the editable schema keys", () => {
    const { container } = render(
      <form>
        <WaitlistFormFields name="Alex Morgan" email="alex.morgan@example.com" notes="Please notify me." />
      </form>
    );
    const form = container.querySelector("form");
    expect(Object.fromEntries(new FormData(form as HTMLFormElement))).toEqual({
      name: "Alex Morgan",
      email: "alex.morgan@example.com",
      notes: "Please notify me."
    });
  });
});
