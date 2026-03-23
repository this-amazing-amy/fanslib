# PRD: Portrait (9:16) media previews & gallery layout (Appearance setting)

## Problem Statement

Users who work with vertical / phone-native content currently see all library and in-app media thumbnails in a **square (1:1)** frame. That does not match how the media will appear on short-form surfaces, makes it harder to judge framing and composition at a glance, and wastes horizontal space in grids tuned for square cells.

There is no centralized control: some prototype routes can pass a custom aspect class to individual tiles, but there is no user-facing switch, and pagination/grid math still assumes square tile height.

## Solution

Add an **Appearance** setting that toggles **portrait media previews (9:16 aspect)** across the app. When enabled:

- Standard media tile surfaces use a **9:16** frame (tall portrait) instead of **1:1**, with the same cover/contain behavior as today unless otherwise specified below.
- The **library gallery** adapts: it shows at most **two rows** of tiles at once, and the **maximum number of columns per row increases by breakpoint** (starting around **4** on narrow layouts and up to **6** on wide layouts, with intermediate breakpoints scaled similarly to today’s grid progression).

The setting is easy to find under **Settings → Appearance**, persists across sessions on the device, and applies consistently anywhere the shared media tile components are used.

## User Stories

1. As a creator, I want to turn on portrait-shaped media thumbnails in Appearance settings, so that previews match how vertical video and phone shots look when published.
2. As a creator, I want that choice to apply everywhere I see standard media tiles (library, shoots, post previews, calendars, dialogs), so I do not have to re-learn different shapes in different features.
3. As a creator, I want the library grid to show at most two rows when portrait mode is on, so tall tiles do not overwhelm the viewport and pagination stays usable.
4. As a creator, I want more columns on wider screens in portrait mode (up to roughly six), so I still see a reasonable number of items per page despite each row only having two slots vertically.
5. As a creator, I want to turn portrait previews off and return to square tiles, so I can match my previous workflow or prefer square browsing.
6. As a creator, I want my Appearance choice remembered after closing the app, so I do not reset it every session.
7. As a creator browsing the library, I want pagination (items per page) to stay sensible when tile height changes, so I am not stuck with page sizes computed for square tiles only.
8. As a creator using dialogs (e.g. pick media for a post), I want thumbnails to respect the same portrait setting as the main library, so selection feels consistent.
9. As a creator viewing shoots or post detail surfaces that use the shared tile component, I want the same aspect behavior, unless a surface is explicitly a tiny icon-sized preview.
10. As a developer maintaining the app, I want one source of truth for “current media aspect mode,” so new screens using the standard tile pick up the behavior automatically.
11. As a creator on a small laptop screen, I want the portrait grid to still use a readable number of columns (not too many narrow slivers), so breakpoint rules stay tuned for real viewports.
12. As a creator, I want the theme (light/dark) and portrait preview toggle to live together under Appearance, so visual preferences are grouped logically.
13. As a creator, I want switching the setting to take effect without a full page reload, so I can compare behaviors quickly.
14. As a user with accessibility needs, I want layout shifts to remain predictable when toggling the setting, so focus order and scroll regions do not break.
15. As a creator, I want video duration and existing tile chrome (tags, filename, post indicators where present) to remain available in portrait mode, so I do not lose metadata for layout reasons.
16. As a power user, I want grid size (small/large) preferences to still influence density where applicable, so portrait mode composes with existing library density controls rather than replacing them blindly.
17. As a creator, I want empty or loading library states to behave the same as today, with only tile shape and grid rules changing.
18. As a stakeholder, I want the dev-only media tile showcase route either removed or aligned with the global setting, so internal demos do not contradict the product toggle.

## Implementation Decisions

- **Global preference module (deep module)**  
  Introduce a small, stable API for “media display mode” (e.g. square vs portrait 9:16): read/write preference, default to square, persisted in **browser local storage** (same general pattern as other client-side preferences in the app). Mount a single provider near the app shell so any route can consume it without prop drilling.

- **Appearance UI**  
  Extend the Appearance settings screen with a labeled control (toggle or segmented control) describing portrait 9:16 previews and the gallery behavior (two rows, wider column caps). Copy should clarify that this affects thumbnails/previews, not exported file dimensions.

- **Media tile components**  
  Centralize aspect framing: the shared full and lite tile components resolve the effective frame class from global preference, with an optional escape hatch for tests or exceptional layouts. Default remains square when the preference is off. Portrait uses a **9:16** aspect frame; object-fit behavior aligns with existing cover/contain rules per tile variant.

- **Gallery grid and container-query breakpoints**  
  When portrait mode is active, replace the current library-only grid column classes with a dedicated breakpoint map: **maximum two visible rows** (driven by pagination/layout math, not infinite scroll assumptions), and column counts that **start around four** on small containers and **scale up to about six** on large containers, with intermediate steps analogous to the current `@container` ladder. Exact pixel/container thresholds should mirror existing breakpoints where possible for consistency.

- **Dynamic page size**  
  Update the hook that derives optimal page size from container width and height: today it assumes **square** tile height equals column width. In portrait mode, tile height must reflect **9:16** (taller cells), and **row count must be capped at two** for the purpose of fitting the viewport and computing items-per-page. Re-run calculations when the preference or grid size changes.

- **Surfaces using standard tiles**  
  All call sites that render the shared `MediaTile` / `MediaTileLite` components inherit the global preference automatically. **Fixed-size micro thumbnails** (e.g. very small list icons with explicit width/height) may either opt out or keep a square crop by design; document the rule: “icon-sized or explicitly fixed dimensions override global aspect.”

- **Non-tile previews**  
  If some screens render raw `img`/`video` without the shared tile wrapper, they are **out of scope** unless listed in a follow-up; the PRD assumes primary coverage through the shared tile pipeline.

- **SSR and hydration**  
  Persisted preference must hydrate after mount without layout flash where feasible (same constraints as other localStorage-backed preferences).

- **Analytics / FYP or bespoke cards**  
  If those views use custom layouts rather than `MediaTile`, they are **not** automatically in scope unless they are updated to consume the same preference in a later task.

## Testing Decisions

- **What good tests cover**  
  Prefer testing **observable behavior**: preference round-trip (read/write default), pure helpers for grid column counts and page-size math given width/height/mode, and that tile components receive the resolved aspect class when the (mocked) preference is portrait vs square.

- **Modules to test**  
  - Preference reducer/merge and persistence boundaries (if extracted).  
  - Pure functions for **column breakpoints** and **page size** under portrait vs square.  
  - Optional: one component test ensuring a representative `MediaTile` applies the portrait frame class when the provider says portrait.

- **Prior art**  
  Follow patterns used for other preference hooks and existing media tile tests (render + assert class names or roles, mock providers where needed).

## Out of Scope

- Changing **actual media files**, transcoding, or server-side aspect metadata.
- **Syncing** the preference across devices or users via the backend (client-only persistence unless product later requests server settings).
- Redesigning **non-library** layouts (e.g. full-screen media detail viewer) beyond what shared tiles already control.
- **Automatic** detection of portrait vs landscape per file; this PRD is **user-controlled** only.
- Third-party or extension UIs outside the web app shell.

## Further Notes

- **Open product questions** (confirm before or during implementation):  
  - Should **shoot detail** and **post calendar** use the exact same column breakpoints as the main library, or only the same aspect ratio with local grid rules?  
  - Should the **dev media-tile-aspect** prototype route be **removed** or refactored to read the global setting for side-by-side QA?

- **Performance**: Taller tiles mean fewer items per viewport height; capping at two rows and adjusting pagination avoids loading unreasonably large pages.

- **Naming**: Prefer user-facing copy like “Portrait previews (9:16)” rather than internal aspect ratio jargon in the UI.
