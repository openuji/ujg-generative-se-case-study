import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormWithSubmit } from "./FormWithSubmit";
import { RegistrationFormFields } from "../../components/RegistrationFormFields/RegistrationFormFields";
import { WaitlistFormFields } from "../../components/WaitlistFormFields/WaitlistFormFields";
import { ActionControl } from "../../components/ActionControl/ActionControl";

describe("FormWithSubmit", () => {
  it("serializes the exact registration-form-data schema keys, excluding errors", () => {
    const onSubmit = vi.fn();
    render(
      <FormWithSubmit
        formFields={<RegistrationFormFields />}
        formSubmitAction={<ActionControl label="Continue" type="submit" />}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Priya Shah" } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "priya@example.com" } });
    fireEvent.change(screen.getByLabelText("Accessibility notes"), {
      target: { value: "Wheelchair access needed." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0] as FormData;
    expect([...submitted.keys()].sort()).toEqual(["accessibilityNotes", "email", "name"]);
    expect(submitted.get("name")).toBe("Priya Shah");
    expect(submitted.get("email")).toBe("priya@example.com");
    expect(submitted.get("accessibilityNotes")).toBe("Wheelchair access needed.");
  });

  it("serializes the exact waitlist-form-data schema keys", () => {
    const onSubmit = vi.fn();
    render(
      <FormWithSubmit
        formFields={<WaitlistFormFields />}
        formSubmitAction={<ActionControl label="Continue" type="submit" />}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "jordan@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0] as FormData;
    expect([...submitted.keys()].sort()).toEqual(["email", "name", "notes"]);
  });
});
