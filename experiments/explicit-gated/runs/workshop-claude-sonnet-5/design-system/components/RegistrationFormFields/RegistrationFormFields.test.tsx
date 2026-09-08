import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RegistrationFormFields } from "./RegistrationFormFields";

afterEach(cleanup);

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function submittedEntries() {
  const form = screen.getByRole("form", { name: "Registration details" }) as HTMLFormElement;
  return Object.fromEntries(new FormData(form));
}

describe("RegistrationFormFields", () => {
  it("submits exactly the editable properties of its data contract", () => {
    render(
      <form aria-label="Registration details">
        <RegistrationFormFields />
      </form>
    );

    fill("Name", "Ada Lovelace");
    fill("Email", "ada@example.org");
    fill("Accessibility notes", "Step-free access");

    expect(submittedEntries()).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.org",
      accessibilityNotes: "Step-free access"
    });
  });

  it("renders supplied values and keeps validation metadata out of the submission", () => {
    render(
      <form aria-label="Registration details">
        <RegistrationFormFields
          name="Ada Lovelace"
          email="not-an-address"
          errors={{ email: "Enter an email address." }}
        />
      </form>
    );

    expect(screen.getByRole("alert").textContent).toBe("Enter an email address.");
    expect(screen.getByLabelText("Email").getAttribute("aria-invalid")).toBe("true");
    expect(Object.keys(submittedEntries())).toEqual(["name", "email", "accessibilityNotes"]);
  });
});
