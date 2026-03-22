/**
 * Selector for Fansly's caption textarea.
 * Targets the textarea inside the `.new-post-content` container.
 */
export const FANSLY_CAPTION_SELECTOR = '.new-post-content textarea';

/**
 * Insert a caption value into a DOM element, dispatching events
 * so that Angular's change detection picks up the value change.
 */
export const insertCaptionIntoElement = (
  element: HTMLTextAreaElement | HTMLInputElement,
  caption: string,
): void => {
  if (!caption) return;
  if (element.value) return;

  element.value = caption;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
};

/**
 * Observe the DOM for Fansly's caption textarea appearing.
 * Calls the callback each time a matching element is added.
 * Returns a disconnect function to stop observing.
 */
export const observeFanslyCaptionInput = (
  onFound: (element: HTMLTextAreaElement) => void,
): (() => void) => {
  // Check if already present
  const existing = document.querySelector(FANSLY_CAPTION_SELECTOR);
  if (existing) {
    onFound(existing as HTMLTextAreaElement);
  }

  const observer = new MutationObserver((mutations) => {
    mutations
      .flatMap((mutation) => Array.from(mutation.addedNodes))
      .filter((node): node is HTMLElement => node instanceof HTMLElement)
      .forEach((node) => {
        // Check if the added node itself matches
        if (node.matches(FANSLY_CAPTION_SELECTOR)) {
          onFound(node as HTMLTextAreaElement);
          return;
        }

        // Check descendants of the added node
        const match = node.querySelector(FANSLY_CAPTION_SELECTOR);
        if (match) {
          onFound(match as HTMLTextAreaElement);
        }
      });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
};
