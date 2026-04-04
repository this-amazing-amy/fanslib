/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock TanStack Router
const mockNavigate = vi.fn();
const mockParams = { id: "new" };
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: { children: React.ReactNode; to: string } & Record<string, unknown>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

// Mock queries — keep mutation fns accessible for assertions
const mockScheduleQuery = { data: undefined as unknown, isLoading: false, error: null };
const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();

vi.mock("~/lib/queries/content-schedules", () => ({
  useContentScheduleQuery: () => mockScheduleQuery,
  useCreateContentScheduleMutation: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
  useUpdateContentScheduleMutation: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
  useDeleteContentScheduleMutation: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}));

// Mock ContentScheduleForm to isolate page-level behavior
vi.mock("~/features/channels/components/ContentScheduleForm", () => ({
  ContentScheduleForm: ({ schedule, onSubmit, onCancel }: Record<string, unknown>) => (
    <div data-testid="schedule-form">
      <span data-testid="form-mode">{schedule ? "edit" : "create"}</span>
      <button
        data-testid="form-submit"
        onClick={() => (onSubmit as (data: unknown) => void)?.({ name: "Test" })}
      >
        Submit
      </button>
      <button data-testid="form-cancel" onClick={() => (onCancel as () => void)?.()}>
        Cancel
      </button>
    </div>
  ),
}));

import { ScheduleDetailPage } from "./ScheduleDetailPage";

describe("ScheduleDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockScheduleQuery.data = undefined;
    mockScheduleQuery.isLoading = false;
  });

  test("renders form in create mode when id is 'new'", () => {
    mockParams.id = "new";

    render(<ScheduleDetailPage />);

    expect(screen.getByText("New Schedule")).toBeInTheDocument();
    expect(screen.getByTestId("schedule-form")).toBeInTheDocument();
    expect(screen.getByTestId("form-mode")).toHaveTextContent("create");
  });

  test("renders form in edit mode with schedule data", () => {
    mockParams.id = "abc-123";
    mockScheduleQuery.data = {
      id: "abc-123",
      name: "My Daily Schedule",
      emoji: null,
      color: null,
      type: "daily",
      postsPerTimeframe: 2,
      preferredDays: null,
      preferredTimes: null,
      mediaFilters: null,
      scheduleChannels: [],
    };

    render(<ScheduleDetailPage />);

    expect(screen.getByText("Edit: My Daily Schedule")).toBeInTheDocument();
    expect(screen.getByTestId("schedule-form")).toBeInTheDocument();
    expect(screen.getByTestId("form-mode")).toHaveTextContent("edit");
  });

  test("shows loading state when fetching existing schedule", () => {
    mockParams.id = "abc-123";
    mockScheduleQuery.isLoading = true;

    render(<ScheduleDetailPage />);

    expect(screen.getByText("Loading schedule...")).toBeInTheDocument();
    expect(screen.queryByTestId("schedule-form")).not.toBeInTheDocument();
  });

  test("shows not found when schedule data is missing", () => {
    mockParams.id = "abc-123";

    render(<ScheduleDetailPage />);

    expect(screen.getByText("Schedule not found")).toBeInTheDocument();
    expect(screen.getByText("Back to Schedules")).toBeInTheDocument();
  });

  test("submitting in create mode calls create mutation and navigates", async () => {
    mockParams.id = "new";
    mockCreateMutateAsync.mockResolvedValue({ id: "new-id-456" });

    render(<ScheduleDetailPage />);

    await userEvent.click(screen.getByTestId("form-submit"));

    expect(mockCreateMutateAsync).toHaveBeenCalledWith({ name: "Test" });
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/schedules/$id",
      params: { id: "new-id-456" },
    });
  });

  test("submitting in edit mode calls update mutation", async () => {
    mockParams.id = "abc-123";
    mockScheduleQuery.data = {
      id: "abc-123",
      name: "Existing",
      emoji: null,
      color: null,
      type: "daily",
      postsPerTimeframe: 1,
      preferredDays: null,
      preferredTimes: null,
      mediaFilters: null,
      scheduleChannels: [],
    };
    mockUpdateMutateAsync.mockResolvedValue({});

    render(<ScheduleDetailPage />);

    await userEvent.click(screen.getByTestId("form-submit"));

    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
      id: "abc-123",
      updates: { name: "Test" },
    });
  });

  test("cancel navigates back to schedules list", async () => {
    mockParams.id = "new";

    render(<ScheduleDetailPage />);

    await userEvent.click(screen.getByTestId("form-cancel"));

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/schedules" });
  });

  test("delete button shows for existing schedules with confirmation", async () => {
    mockParams.id = "abc-123";
    mockScheduleQuery.data = {
      id: "abc-123",
      name: "To Delete",
      emoji: null,
      color: null,
      type: "daily",
      postsPerTimeframe: 1,
      preferredDays: null,
      preferredTimes: null,
      mediaFilters: null,
      scheduleChannels: [],
    };
    mockDeleteMutateAsync.mockResolvedValue({});

    render(<ScheduleDetailPage />);

    // Delete button should exist
    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    expect(deleteBtn).toBeInTheDocument();

    // Clicking shows confirmation
    await userEvent.click(deleteBtn);
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

    // Confirming triggers delete and navigates
    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    await userEvent.click(confirmBtn);

    expect(mockDeleteMutateAsync).toHaveBeenCalledWith("abc-123");
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/schedules" });
  });

  test("delete button does not show in create mode", () => {
    mockParams.id = "new";

    render(<ScheduleDetailPage />);

    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });
});
