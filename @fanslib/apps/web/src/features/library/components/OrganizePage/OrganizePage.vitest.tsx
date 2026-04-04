/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

// Mock the organize queries
const mockUseUnmanagedMediaQuery = vi.fn();
const mockOrganizeMutateAsync = vi.fn();
vi.mock("~/lib/queries/organize", () => ({
  useUnmanagedMediaQuery: () => mockUseUnmanagedMediaQuery(),
  useKnownRolesQuery: () => ({ data: [] }),
  useKnownPackagesQuery: () => ({ data: [] }),
  useOrganizeMutation: () => ({ mutateAsync: mockOrganizeMutateAsync, isPending: false }),
}));

const mockCreateShootMutateAsync = vi.fn().mockResolvedValue({ id: "new-shoot-id", name: "Test" });
vi.mock("~/lib/queries/shoots", () => ({
  useShootsQuery: () => ({ data: { items: [] } }),
  useCreateShootMutation: () => ({ mutateAsync: mockCreateShootMutateAsync, isPending: false }),
}));

vi.mock("~/features/library/components/MediaTile", () => ({
  MediaTile: () => <div data-testid="organize-media-tile" aria-hidden />,
}));

import { OrganizePage } from "./OrganizePage";

const pickContentRatingUncensored = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByLabelText(/content rating for photo1\.jpg/i));
  await user.click(await screen.findByRole("option", { name: /Uncensored \(uc\)/i }));
};

describe("OrganizePage", () => {
  test("shows empty state when no unmanaged files exist", () => {
    mockUseUnmanagedMediaQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<OrganizePage />);

    expect(screen.getByText(/all files are organized/i)).toBeInTheDocument();
  });

  test("shows loading state while fetching", () => {
    mockUseUnmanagedMediaQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<OrganizePage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("displays unmanaged files grouped by folder", () => {
    mockUseUnmanagedMediaQuery.mockReturnValue({
      data: [
        {
          folder: "unsorted/setA",
          media: [
            {
              id: "m1",
              name: "photo1.jpg",
              type: "image",
              relativePath: "unsorted/setA/photo1.jpg",
            },
            {
              id: "m2",
              name: "photo2.jpg",
              type: "image",
              relativePath: "unsorted/setA/photo2.jpg",
            },
          ],
        },
        {
          folder: "unsorted/setB",
          media: [
            { id: "m3", name: "clip.mp4", type: "video", relativePath: "unsorted/setB/clip.mp4" },
          ],
        },
      ],
      isLoading: false,
    });

    render(<OrganizePage />);

    // Folder group headers should be visible
    expect(screen.getByText("unsorted/setA")).toBeInTheDocument();
    expect(screen.getByText("unsorted/setB")).toBeInTheDocument();

    // File names should be visible
    expect(screen.getByText("photo1.jpg")).toBeInTheDocument();
    expect(screen.getByText("photo2.jpg")).toBeInTheDocument();
    expect(screen.getByText("clip.mp4")).toBeInTheDocument();
  });

  test("files can be selected and deselected via checkboxes", async () => {
    const user = userEvent.setup();

    mockUseUnmanagedMediaQuery.mockReturnValue({
      data: [
        {
          folder: "unsorted",
          media: [
            { id: "m1", name: "photo1.jpg", type: "image", relativePath: "unsorted/photo1.jpg" },
            { id: "m2", name: "photo2.jpg", type: "image", relativePath: "unsorted/photo2.jpg" },
          ],
        },
      ],
      isLoading: false,
    });

    render(<OrganizePage />);

    const checkboxes = screen.getAllByRole("checkbox");
    // Should have per-file checkboxes (at minimum)
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);

    // Initially unchecked
    const fileCheckbox = checkboxes[0];
    expect(fileCheckbox).not.toBeChecked();

    // Click to select
    await user.click(fileCheckbox);
    expect(fileCheckbox).toBeChecked();

    // Click again to deselect
    await user.click(fileCheckbox);
    expect(fileCheckbox).not.toBeChecked();
  });

  test("folder checkbox selects and clears all files in that folder only", async () => {
    const user = userEvent.setup();

    mockUseUnmanagedMediaQuery.mockReturnValue({
      data: [
        {
          folder: "folderA",
          media: [
            { id: "a1", name: "a1.jpg", type: "image", relativePath: "folderA/a1.jpg" },
            { id: "a2", name: "a2.jpg", type: "image", relativePath: "folderA/a2.jpg" },
          ],
        },
        {
          folder: "folderB",
          media: [{ id: "b1", name: "b1.jpg", type: "image", relativePath: "folderB/b1.jpg" }],
        },
      ],
      isLoading: false,
    });

    render(<OrganizePage />);

    const folderACheckbox = screen.getByLabelText(/select all files in folderA/i);
    await user.click(folderACheckbox);

    expect(screen.getByLabelText(/select a1\.jpg/i)).toBeChecked();
    expect(screen.getByLabelText(/select a2\.jpg/i)).toBeChecked();
    expect(screen.getByLabelText(/select b1\.jpg/i)).not.toBeChecked();

    await user.click(folderACheckbox);
    expect(screen.getByLabelText(/select a1\.jpg/i)).not.toBeChecked();
    expect(screen.getByLabelText(/select a2\.jpg/i)).not.toBeChecked();
  });

  test("shows shoot selection with existing shoots and new shoot option", async () => {
    const user = userEvent.setup();

    mockUseUnmanagedMediaQuery.mockReturnValue({
      data: [
        {
          folder: "unsorted",
          media: [
            { id: "m1", name: "photo1.jpg", type: "image", relativePath: "unsorted/photo1.jpg" },
          ],
        },
      ],
      isLoading: false,
    });

    render(<OrganizePage />);

    // Shoot selector should be visible
    expect(screen.getByLabelText(/select shoot/i)).toBeInTheDocument();

    // "New shoot" toggle button should be visible
    const newShootButton = screen.getByRole("button", { name: /new shoot/i });
    expect(newShootButton).toBeInTheDocument();

    // Click to switch to create mode
    await user.click(newShootButton);

    // Should show name input for new shoot
    expect(screen.getByLabelText(/shoot name/i)).toBeInTheDocument();
  });

  test("selected files show per-file metadata inputs (package, role, content rating)", async () => {
    const user = userEvent.setup();

    mockUseUnmanagedMediaQuery.mockReturnValue({
      data: [
        {
          folder: "unsorted",
          media: [
            { id: "m1", name: "photo1.jpg", type: "image", relativePath: "unsorted/photo1.jpg" },
          ],
        },
      ],
      isLoading: false,
    });

    render(<OrganizePage />);

    // Select the file
    const checkbox = screen.getByLabelText(/select photo1\.jpg/i);
    await user.click(checkbox);

    // Per-file metadata should now appear
    expect(screen.getByLabelText(/package for photo1\.jpg/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role for photo1\.jpg/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content rating for photo1\.jpg/i)).toBeInTheDocument();

    const ratingTrigger = screen.getByLabelText(/content rating for photo1\.jpg/i);
    expect(ratingTrigger).toBeInTheDocument();
    await user.click(ratingTrigger);
    const ratingOptions = screen.getAllByRole("option");
    expect(ratingOptions.length).toBeGreaterThanOrEqual(5);
  });

  test("shows live preview of target filenames when metadata is filled in", async () => {
    const user = userEvent.setup();

    mockUseUnmanagedMediaQuery.mockReturnValue({
      data: [
        {
          folder: "unsorted",
          media: [
            { id: "m1", name: "photo1.jpg", type: "image", relativePath: "unsorted/photo1.jpg" },
          ],
        },
      ],
      isLoading: false,
    });

    render(<OrganizePage />);

    // Select file
    await user.click(screen.getByLabelText(/select photo1\.jpg/i));

    // Switch to new shoot and fill in name
    await user.click(screen.getByRole("button", { name: /new shoot/i }));
    await user.type(screen.getByLabelText(/shoot name/i), "BeachDay");

    // Fill in per-file metadata
    await user.type(screen.getByLabelText(/package for photo1\.jpg/i), "main");
    await user.type(screen.getByLabelText(/role for photo1\.jpg/i), "content");
    await pickContentRatingUncensored(user);

    // Preview section should show the target filename pattern
    const preview = screen.getByTestId("preview-section");
    expect(preview).toBeInTheDocument();
    // Should contain parts of the target path: shoot name, package, role, rating
    expect(preview.textContent).toContain("BeachDay");
    expect(preview.textContent).toContain("main");
    expect(preview.textContent).toContain("content");
    expect(preview.textContent).toContain("uc");
    expect(preview.textContent).toContain(".jpg");
  });

  test("submit button calls organize mutation with selected files and metadata", async () => {
    const user = userEvent.setup();
    mockOrganizeMutateAsync.mockResolvedValue({
      results: [
        {
          mediaId: "m1",
          finalPath: "2025/20250115_BeachDay/20250115_BeachDay_main_content_uc.jpg",
        },
      ],
      errors: [],
    });

    mockUseUnmanagedMediaQuery.mockReturnValue({
      data: [
        {
          folder: "unsorted",
          media: [
            { id: "m1", name: "photo1.jpg", type: "image", relativePath: "unsorted/photo1.jpg" },
          ],
        },
      ],
      isLoading: false,
    });

    render(<OrganizePage />);

    // Select file and fill metadata
    await user.click(screen.getByLabelText(/select photo1\.jpg/i));
    await user.click(screen.getByRole("button", { name: /new shoot/i }));
    await user.type(screen.getByLabelText(/shoot name/i), "BeachDay");
    await user.type(screen.getByLabelText(/package for photo1\.jpg/i), "main");
    await user.type(screen.getByLabelText(/role for photo1\.jpg/i), "content");
    await pickContentRatingUncensored(user);

    // Submit button should be enabled
    const submitButton = screen.getByRole("button", { name: /move 1 file/i });
    expect(submitButton).toBeInTheDocument();

    await user.click(submitButton);

    expect(mockOrganizeMutateAsync).toHaveBeenCalled();
  });

  test("submit button is disabled when no files are selected", () => {
    mockUseUnmanagedMediaQuery.mockReturnValue({
      data: [
        {
          folder: "unsorted",
          media: [
            { id: "m1", name: "photo1.jpg", type: "image", relativePath: "unsorted/photo1.jpg" },
          ],
        },
      ],
      isLoading: false,
    });

    render(<OrganizePage />);

    const submitButton = screen.getByRole("button", { name: /move/i });
    expect(submitButton).toBeDisabled();
  });

  test("displays errors from the organize response", async () => {
    const user = userEvent.setup();
    mockOrganizeMutateAsync.mockResolvedValue({
      results: [],
      errors: [{ mediaId: "m1", error: "File not found on disk" }],
    });

    mockUseUnmanagedMediaQuery.mockReturnValue({
      data: [
        {
          folder: "unsorted",
          media: [
            { id: "m1", name: "photo1.jpg", type: "image", relativePath: "unsorted/photo1.jpg" },
          ],
        },
      ],
      isLoading: false,
    });

    render(<OrganizePage />);

    // Select and fill metadata
    await user.click(screen.getByLabelText(/select photo1\.jpg/i));
    await user.click(screen.getByRole("button", { name: /new shoot/i }));
    await user.type(screen.getByLabelText(/shoot name/i), "BeachDay");
    await user.type(screen.getByLabelText(/package for photo1\.jpg/i), "main");
    await user.type(screen.getByLabelText(/role for photo1\.jpg/i), "content");
    await pickContentRatingUncensored(user);

    await user.click(screen.getByRole("button", { name: /move 1 file/i }));

    // Error should be displayed
    expect(await screen.findByText(/file not found on disk/i)).toBeInTheDocument();
  });
});
