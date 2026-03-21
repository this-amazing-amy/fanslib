/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
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
    expect(screen.getByText("1m 35s")).toBeInTheDocument();
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

  test("formats sub-minute engagement as seconds only", () => {
    render(<AnalyticsPostCard {...defaultProps} averageEngagementSeconds={45} />);
    expect(screen.getByText("45s")).toBeInTheDocument();
  });

  test("formats exact minutes without remaining seconds", () => {
    render(<AnalyticsPostCard {...defaultProps} averageEngagementSeconds={120} />);
    expect(screen.getByText("2m")).toBeInTheDocument();
  });

  test("renders action slot when provided", () => {
    render(
      <AnalyticsPostCard
        {...defaultProps}
        actionSlot={<button>Remove</button>}
      />
    );
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });
});
