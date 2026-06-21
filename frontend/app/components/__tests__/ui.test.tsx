import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import { Badge, StatusPanel, SearchBox, Stat } from "~/components/ui";
import { renderWithProviders } from "~/test/renderWithProviders";
import { MapPin } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Badge                                                              */
/* ------------------------------------------------------------------ */

describe("Badge", () => {
  it("renders children", () => {
    renderWithProviders(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("defaults to slate tone", () => {
    const { container } = renderWithProviders(<Badge>Default</Badge>);
    const span = container.querySelector("span");
    expect(span?.className).toContain("bg-slate-100");
    expect(span?.className).toContain("text-slate-700");
  });

  it("applies green tone classes", () => {
    const { container } = renderWithProviders(<Badge tone="green">Approved</Badge>);
    const span = container.querySelector("span");
    expect(span?.className).toContain("bg-emerald-50");
    expect(span?.className).toContain("text-emerald-700");
  });

  it("applies amber tone classes", () => {
    const { container } = renderWithProviders(<Badge tone="amber">Pending</Badge>);
    const span = container.querySelector("span");
    expect(span?.className).toContain("bg-amber-50");
    expect(span?.className).toContain("text-amber-700");
  });

  it("applies brand tone classes", () => {
    const { container } = renderWithProviders(<Badge tone="brand">Info</Badge>);
    const span = container.querySelector("span");
    expect(span?.className).toContain("bg-indigo-50");
    expect(span?.className).toContain("text-indigo-700");
  });

  it("applies violet tone classes", () => {
    const { container } = renderWithProviders(<Badge tone="violet">Premium</Badge>);
    const span = container.querySelector("span");
    expect(span?.className).toContain("bg-violet-50");
    expect(span?.className).toContain("text-violet-700");
  });

  it("applies red tone classes", () => {
    const { container } = renderWithProviders(<Badge tone="red">Expired</Badge>);
    const span = container.querySelector("span");
    expect(span?.className).toContain("bg-red-50");
    expect(span?.className).toContain("text-red-700");
  });
});

/* ------------------------------------------------------------------ */
/*  StatusPanel                                                        */
/* ------------------------------------------------------------------ */

describe("StatusPanel", () => {
  it("renders loading state with spinner and status role", () => {
    const { container } = renderWithProviders(
      <StatusPanel type="loading" title="Loading data" message="Please wait" />,
    );
    expect(screen.getByText("Loading data")).toBeInTheDocument();
    expect(screen.getByText("Please wait")).toBeInTheDocument();
    const statusDiv = screen.getByRole("status");
    const svg = statusDiv.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("animate-spin");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders empty state with sparkles icon", () => {
    const { container } = renderWithProviders(
      <StatusPanel type="empty" title="Nothing here" message="No items found" />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("No items found")).toBeInTheDocument();
    const svg = container.querySelector("svg");
    expect(svg?.className).not.toContain("animate-spin");
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders error state with alert role", () => {
    renderWithProviders(
      <StatusPanel type="error" title="Something went wrong" message="Try again later" />,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Try again later")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders success state with check icon", () => {
    const { container } = renderWithProviders(
      <StatusPanel type="success" title="Done!" message="Operation completed" />,
    );
    expect(screen.getByText("Done!")).toBeInTheDocument();
    expect(screen.getByText("Operation completed")).toBeInTheDocument();
    const svg = container.querySelector("svg");
    expect(svg?.className).not.toContain("animate-spin");
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  SearchBox                                                          */
/* ------------------------------------------------------------------ */

describe("SearchBox", () => {
  it("renders with default placeholder", () => {
    renderWithProviders(<SearchBox />);
    const input = screen.getByPlaceholderText("Search");
    expect(input).toBeInTheDocument();
    expect(input).not.toHaveAttribute("type", "hidden");
  });

  it("renders with custom placeholder", () => {
    renderWithProviders(<SearchBox placeholder="Find creators..." />);
    expect(screen.getByPlaceholderText("Find creators...")).toBeInTheDocument();
  });

  it("displays the provided value", () => {
    renderWithProviders(<SearchBox value="test" onChange={() => {}} />);
    const input = screen.getByPlaceholderText("Search") as HTMLInputElement;
    expect(input.value).toBe("test");
  });

  it("calls onChange when user types", () => {
    const onChange = vi.fn();
    renderWithProviders(<SearchBox value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "new value" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("spreads additional props to the input", () => {
    renderWithProviders(<SearchBox data-testid="my-search" disabled />);
    const input = screen.getByTestId("my-search");
    expect(input).toBeDisabled();
  });

  it("renders a search icon", () => {
    const { container } = renderWithProviders(<SearchBox />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("has an sr-only label matching the placeholder", () => {
    renderWithProviders(<SearchBox placeholder="Search users" />);
    const label = document.querySelector("label");
    expect(label).toBeInTheDocument();
    const srOnly = label?.querySelector(".sr-only");
    expect(srOnly?.textContent).toBe("Search users");
  });
});

/* ------------------------------------------------------------------ */
/*  Stat                                                               */
/* ------------------------------------------------------------------ */

describe("Stat", () => {
  it("renders label and value", () => {
    renderWithProviders(<Stat icon={MapPin} label="Cities" value="12" />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Cities")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    const { container } = renderWithProviders(<Stat icon={MapPin} label="Cities" value="12" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("wraps content in a Card section", () => {
    const { container } = renderWithProviders(<Stat icon={MapPin} label="Cities" value="12" />);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
    expect(section?.className).toContain("rounded-3xl");
  });
});
