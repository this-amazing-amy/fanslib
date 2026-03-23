/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

vi.mock("../GrowthChart", () => ({
  GrowthChart: () => <div data-testid="growth-chart" />,
}));

import { AnalyticsPostCard } from "./AnalyticsPostCard";

describe("AnalyticsPostCard", () => {
  const defaultProps = {
    mediaId: "media-123",
    caption: "Test caption for the post",
    totalViews: 1500,
    averageEngagementPercent: 42.7,
    averageEngagementSeconds: 95,
  };

  test("displays caption text", () => {
    render(<AnalyticsPostCard {...defaultProps} />);
    expect(screen.getByText("Test caption for the post")).toBeInTheDocument();
  });

  test("displays all three stat values", () => {
    render(<AnalyticsPostCard {...defaultProps} />);
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("42.7%")).toBeInTheDocument();
    expect(screen.getByText("1m 35.0s")).toBeInTheDocument();
  });

  test("renders thumbnail image with correct src", () => {
    render(<AnalyticsPostCard {...defaultProps} />);
    const img = screen.getByRole("presentation");
    expect(img).toHaveAttribute("src", expect.stringContaining("media-123"));
  });

  test("does not render caption when null", () => {
    render(<AnalyticsPostCard {...defaultProps} caption={null} />);
    expect(screen.queryByText("Test caption for the post")).not.toBeInTheDocument();
  });

  test("formats sub-minute engagement with one decimal", () => {
    render(<AnalyticsPostCard {...defaultProps} averageEngagementSeconds={45} />);
    expect(screen.getByText("45.0s")).toBeInTheDocument();
  });

  test("formats fractional sub-minute engagement with one decimal", () => {
    render(<AnalyticsPostCard {...defaultProps} averageEngagementSeconds={3.24} />);
    expect(screen.getByText("3.2s")).toBeInTheDocument();
  });

  test("formats exact minutes without remaining seconds", () => {
    render(<AnalyticsPostCard {...defaultProps} averageEngagementSeconds={120} />);
    expect(screen.getByText("2m")).toBeInTheDocument();
  });

  test("renders sparkline when datapoints and sortMetric are provided", () => {
    const datapoints = [
      { timestamp: 1000, views: 0, interactionTime: 0 },
      { timestamp: 2000, views: 50, interactionTime: 5000 },
      { timestamp: 3000, views: 100, interactionTime: 10000 },
    ];
    const { container } = render(
      <AnalyticsPostCard {...defaultProps} datapoints={datapoints} sortMetric="views" />,
    );
    const sparklinePath = container.querySelector(".recharts-line-curve");
    expect(sparklinePath).toBeInTheDocument();
  });

  test("clicking a metric selects it for the chart and deselects others", async () => {
    const datapoints = [
      { timestamp: 1000, views: 0, interactionTime: 0 },
      { timestamp: 2000, views: 50, interactionTime: 5000 },
      { timestamp: 3000, views: 100, interactionTime: 10000 },
    ];
    render(<AnalyticsPostCard {...defaultProps} datapoints={datapoints} sortMetric="views" />);
    const user = userEvent.setup();

    expect(screen.getByRole("button", { name: "Chart: views" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Chart: engagement percent" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.click(screen.getByRole("button", { name: "Chart: engagement percent" }));

    expect(screen.getByRole("button", { name: "Chart: engagement percent" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Chart: views" })).toHaveAttribute("aria-pressed", "false");
  });

  test("does not render sparkline when no datapoints", () => {
    const { container } = render(<AnalyticsPostCard {...defaultProps} />);
    const sparklinePath = container.querySelector(".recharts-line-curve");
    expect(sparklinePath).not.toBeInTheDocument();
  });

  test("clicking card expands growth chart when datapoints exist", async () => {
    const datapoints = [
      { timestamp: 1000, views: 0, interactionTime: 0 },
      { timestamp: 2000, views: 50, interactionTime: 5000 },
      { timestamp: 3000, views: 100, interactionTime: 10000 },
    ];
    const { container } = render(
      <AnalyticsPostCard {...defaultProps} datapoints={datapoints} sortMetric="views" />,
    );
    const user = userEvent.setup();

    // Chart area should not be visible initially
    expect(screen.queryByTestId("growth-chart")).not.toBeInTheDocument();

    // Click the card to expand
    await user.click(container.querySelector("[data-testid='analytics-card']") as HTMLElement);

    // Chart area should now be visible
    expect(screen.getByTestId("growth-chart")).toBeInTheDocument();
  });

  test("clicking expanded card collapses the growth chart", async () => {
    const datapoints = [
      { timestamp: 1000, views: 0, interactionTime: 0 },
      { timestamp: 2000, views: 50, interactionTime: 5000 },
      { timestamp: 3000, views: 100, interactionTime: 10000 },
    ];
    const { container } = render(
      <AnalyticsPostCard {...defaultProps} datapoints={datapoints} sortMetric="views" />,
    );
    const user = userEvent.setup();

    // Expand
    await user.click(container.querySelector("[data-testid='analytics-card']") as HTMLElement);
    expect(screen.getByTestId("growth-chart")).toBeInTheDocument();

    // Collapse
    await user.click(container.querySelector("[data-testid='analytics-card']") as HTMLElement);
    expect(screen.queryByTestId("growth-chart")).not.toBeInTheDocument();
  });

  test("card without datapoints does not expand on click", async () => {
    const { container } = render(<AnalyticsPostCard {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(container.querySelector("[data-testid='analytics-card']") as HTMLElement);
    expect(screen.queryByTestId("growth-chart")).not.toBeInTheDocument();
  });

  test("renders action slot when provided", () => {
    render(<AnalyticsPostCard {...defaultProps} actionSlot={<button>Remove</button>} />);
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });

  test("displays times-posted count when provided", () => {
    render(<AnalyticsPostCard {...defaultProps} timesPosted={3} />);
    expect(screen.getByLabelText("Posted 3 times")).toBeInTheDocument();
  });

  test("does not display times-posted when not provided", () => {
    render(<AnalyticsPostCard {...defaultProps} />);
    expect(screen.queryByLabelText(/^Posted \d+ (?:time|times)$/)).not.toBeInTheDocument();
  });
});
