import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ActionControl } from "../components/ActionControl/ActionControl";
import { RegistrationFormFields } from "../components/RegistrationFormFields/RegistrationFormFields";
import { StatusMessage } from "../components/StatusMessage/StatusMessage";
import { WaitlistFormFields } from "../components/WaitlistFormFields/WaitlistFormFields";
import { WorkshopTeaserContent } from "../components/WorkshopTeaserContent/WorkshopTeaserContent";
import { buildThemeCss, themeOptions } from "./theme";
import { FormWithSubmit } from "../templates/FormWithSubmit/FormWithSubmit";
import { WorkshopTeaserCard } from "../templates/WorkshopTeaserCard/WorkshopTeaserCard";
import { detailData, statusData, teaserData } from "./fixtures";

afterEach(() => cleanup());

describe("design system structure", () => {
  it("renders bound component content", () => {
    render(<WorkshopTeaserContent {...teaserData} />);

    expect(screen.getByText(teaserData.title)).toBeTruthy();
    expect(screen.getByText(teaserData.summary)).toBeTruthy();
  });

  it("preserves template slot composition", () => {
    render(
      <WorkshopTeaserCard
        teaserContent={<WorkshopTeaserContent {...teaserData} />}
        teaserAction={<ActionControl label="Open" />}
      />
    );

    expect(screen.getAllByRole("article").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Open" })).toBeTruthy();
  });

  it("serializes the exact registration form contract", () => {
    render(
      <FormWithSubmit
        formFields={<RegistrationFormFields name="Ada" email="ada@example.com" accessibilityNotes="Captioning" />}
        formSubmitAction={<ActionControl label="Submit" type="submit" />}
      />
    );

    const form = screen.getByRole("form") as HTMLFormElement;
    const formData = Object.fromEntries(new FormData(form).entries());

    expect(formData).toEqual({
      name: "Ada",
      email: "ada@example.com",
      accessibilityNotes: "Captioning"
    });
  });

  it("serializes the exact waitlist form contract", () => {
    render(
      <FormWithSubmit
        formFields={<WaitlistFormFields name="Bea" email="bea@example.com" notes="Flexible timing" />}
        formSubmitAction={<ActionControl label="Join" type="submit" />}
      />
    );

    const form = screen.getByRole("form") as HTMLFormElement;
    const formData = Object.fromEntries(new FormData(form).entries());

    expect(formData).toEqual({
      name: "Bea",
      email: "bea@example.com",
      notes: "Flexible timing"
    });
  });

  it("renders status details without depending on application state", () => {
    render(<StatusMessage {...statusData} message={`${statusData.message} ${detailData.location}`} />);

    expect(screen.getByText(statusData.title)).toBeTruthy();
    expect(screen.getByText(detailData.title)).toBeTruthy();
  });

  it("resolves token-selected theme variables for styling", () => {
    const css = buildThemeCss();

    expect(themeOptions).toHaveLength(2);
    expect(css).toContain("--semantic-surface-page");
    expect(css).toContain("--semantic-action-primary-background");
    expect(css).not.toContain("{foundation.");
  });
});
