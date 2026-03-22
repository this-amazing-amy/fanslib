import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

describe("insertCaption", () => {
  beforeEach(() => {
    GlobalRegistrator.register();
  });

  afterEach(() => {
    GlobalRegistrator.unregister();
  });

  test("sets textarea value and dispatches input event", async () => {
    const { insertCaptionIntoElement } = await import("./caption-inserter");

    const textarea = document.createElement("textarea") as HTMLTextAreaElement;
    document.body.appendChild(textarea);

    const events: string[] = [];
    textarea.addEventListener("input", () => events.push("input"));

    insertCaptionIntoElement(textarea, "Hello world caption");

    expect(textarea.value).toBe("Hello world caption");
    expect(events).toContain("input");
  });

  test("dispatches change event for Angular form bindings", async () => {
    const { insertCaptionIntoElement } = await import("./caption-inserter");

    const textarea = document.createElement("textarea") as HTMLTextAreaElement;
    document.body.appendChild(textarea);

    const events: string[] = [];
    textarea.addEventListener("change", () => events.push("change"));

    insertCaptionIntoElement(textarea, "Test caption");

    expect(events).toContain("change");
  });

  test("does not overwrite when caption is empty", async () => {
    const { insertCaptionIntoElement } = await import("./caption-inserter");

    const textarea = document.createElement("textarea") as HTMLTextAreaElement;
    textarea.value = "Existing text";
    document.body.appendChild(textarea);

    const events: string[] = [];
    textarea.addEventListener("input", () => events.push("input"));

    insertCaptionIntoElement(textarea, "");

    expect(textarea.value).toBe("Existing text");
    expect(events).toHaveLength(0);
  });

  test("does not overwrite when textarea already has content", async () => {
    const { insertCaptionIntoElement } = await import("./caption-inserter");

    const textarea = document.createElement("textarea") as HTMLTextAreaElement;
    textarea.value = "User already typed something";
    document.body.appendChild(textarea);

    const events: string[] = [];
    textarea.addEventListener("input", () => events.push("input"));

    insertCaptionIntoElement(textarea, "New caption from queue");

    expect(textarea.value).toBe("User already typed something");
    expect(events).toHaveLength(0);
  });
});

describe("observeFanslyCaptionInput", () => {
  beforeEach(() => {
    GlobalRegistrator.register();
  });

  afterEach(() => {
    GlobalRegistrator.unregister();
  });

  test("calls callback when matching textarea is added to the DOM", async () => {
    const { observeFanslyCaptionInput } = await import("./caption-inserter");

    const found: Element[] = [];
    const disconnect = observeFanslyCaptionInput((el) => found.push(el));

    // Simulate Fansly adding a caption textarea inside .new-post-content
    const container = document.createElement("div");
    container.className = "new-post-content";
    const textarea = document.createElement("textarea");
    container.appendChild(textarea);
    document.body.appendChild(container);

    // MutationObserver callbacks are async — wait a tick
    await new Promise((r) => setTimeout(r, 50));

    expect(found.length).toBe(1);
    expect(found[0]).toBe(textarea);

    disconnect();
  });

  test("detects textarea that already exists in DOM", async () => {
    const { observeFanslyCaptionInput } = await import("./caption-inserter");

    // Add textarea BEFORE starting observation inside .new-post-content
    const container = document.createElement("div");
    container.className = "new-post-content";
    const textarea = document.createElement("textarea");
    container.appendChild(textarea);
    document.body.appendChild(container);

    const found: Element[] = [];
    const disconnect = observeFanslyCaptionInput((el) => found.push(el));

    expect(found.length).toBe(1);
    expect(found[0]).toBe(textarea);

    disconnect();
  });

  test("does not fire callback for non-matching elements", async () => {
    const { observeFanslyCaptionInput } = await import("./caption-inserter");

    const found: Element[] = [];
    const disconnect = observeFanslyCaptionInput((el) => found.push(el));

    // Add a textarea outside .new-post-content container
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    await new Promise((r) => setTimeout(r, 50));

    expect(found.length).toBe(0);

    disconnect();
  });
});
