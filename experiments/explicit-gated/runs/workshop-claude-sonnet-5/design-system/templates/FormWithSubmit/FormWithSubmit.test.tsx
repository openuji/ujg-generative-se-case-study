import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { RegistrationFormFields } from "../../components/RegistrationFormFields/RegistrationFormFields";
import { FormWithSubmit } from "./FormWithSubmit";

afterEach(cleanup);

describe("FormWithSubmit", () => {
  it("composes its field and submit slots into one submittable form", () => {
    let submitted: Record<string, FormDataEntryValue> | undefined;

    render(
      <FormWithSubmit
        label="Registration details"
        fields={<RegistrationFormFields />}
        submitAction={<ActionControl label="Submit registration details" behavior="submit" />}
        onSubmit={(event) => {
          event.preventDefault();
          submitted = Object.fromEntries(new FormData(event.currentTarget));
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.org" } });
    fireEvent.change(screen.getByLabelText("Accessibility notes"), {
      target: { value: "Step-free access" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit registration details" }));

    expect(submitted).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.org",
      accessibilityNotes: "Step-free access"
    });
  });

  it("renders the slot content it is given rather than owning the fields itself", () => {
    render(
      <FormWithSubmit
        label="Waitlist details"
        fields={<p>Slot content</p>}
        submitAction={<ActionControl label="Submit waitlist details" behavior="submit" />}
      />
    );

    const form = screen.getByRole("form", { name: "Waitlist details" });
    expect(form.textContent).toBe("Slot contentSubmit waitlist details");
    expect(screen.getByRole("button", { name: "Submit waitlist details" }).getAttribute("type")).toBe("submit");
  });
});
