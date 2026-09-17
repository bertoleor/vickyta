import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button (smoke)", () => {
  it("renders children inside a <button>", () => {
    render(<Button variant="primary">Guardar</Button>);
    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe("BUTTON");
  });

  it("is enabled by default and not rendering a spinner", () => {
    render(<Button>Listo</Button>);
    const button = screen.getByRole("button", { name: "Listo" });
    expect(button).not.toBeDisabled();
    expect(button.className).not.toContain("animate-spin");
  });

  it("when isLoading, disables the button and shows the spinner alongside children", () => {
    render(<Button isLoading>Guardando…</Button>);
    const button = screen.getByRole("button", { name: "Guardando…" });
    expect(button).toBeDisabled();
    expect(button.querySelector(".animate-spin")).toBeInTheDocument();
  });
});