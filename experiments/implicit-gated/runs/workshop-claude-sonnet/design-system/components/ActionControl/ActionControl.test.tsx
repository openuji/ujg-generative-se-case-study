import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActionControl } from "./ActionControl";

describe("ActionControl", () => {
  it("renders its label and invokes onAction when pressed", () => {
    const onAction = vi.fn();
    render(<ActionControl label="Register" onAction={onAction} />);

    const button = screen.getByRole("button", { name: "Register" });
    fireEvent.click(button);

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders as a submit control when type is submit", () => {
    render(<ActionControl label="Confirm registration" type="submit" />);
    const button = screen.getByRole("button", { name: "Confirm registration" });
    expect(button.getAttribute("type")).toBe("submit");
  });
});
