# Ubiquitous Language

> A shared vocabulary for the FansLib domain, following [Domain-Driven Design](https://martinfowler.com/bliki/UbiquitousLanguage.html) principles. Every term here should be used consistently in code, conversations, and documentation.
>
> **Audience:** Developer and AI agents working in the codebase.

Each bounded context is organized into three tiers:

- **Domain Concepts** — the language used when thinking about the product
- **Schema & Model Details** — terms that matter when reading or writing code
- **System Internals** — operational concerns, background processes, infrastructure

Terms in **bold** within definitions reference other glossary entries. Enum values are shown in `code formatting`.

---

## Library & Tagging

The content asset management system: storing, organizing, scanning, and classifying media.

### Domain Concepts

#### Media

A file asset (image or video) in the content **library**. The fundamental unit of content in FansLib.

#### Media Type

Classification of a **media** asset: `image` or `video`.

#### Shoot

A collection of **media** captured during a single content creation session. Has a shoot date, name, and description. Used to group related media for browsing, **caption queue** context, and planning. Currently lightweight but intended to become a central planning unit — e.g., creating a shoot before filming, gathering inspiration, tracking completeness ("missing a censored trailer for this shoot").

#### Library

The complete collection of **media** assets managed by the application, stored in the **library path** directory.

#### Tag Dimension

A category axis for classifying media (e.g., "performer", "mood", "activity"). Has a **data type** determining what values tags can hold.

#### Tag Definition

A specific value within a **tag dimension** (e.g., "comedic" under "mood"). Supports parent-child hierarchy for nested categorization.

#### Media Tag

The assignment of a **tag definition** to a **media** asset. Includes a **confidence** score, **tag source**, and optional numeric or boolean value depending on the dimension's **data type**.

#### Tag Source

How a **media tag** was created: `manual` (user-assigned), `automated` (system-generated), or `imported` (from external source).

#### Confidence

A numeric score (0–1) indicating certainty of a **media tag** assignment. Higher = more confident.

#### Hashtag

A social media tag (e.g., `#fansly`) tracked with per-channel usage statistics. Managed independently from post captions.

#### Caption Snippet

A reusable text fragment for post captions — typically links (e.g., to a Beacons page) or in-post decorations. Optionally scoped to a specific **channel**. Distinct from **hashtags**, which have their own analytics.

#### Media Filter

Criteria defining which **media** is eligible for a **channel** or schedule slot. Composed of **tag dimension** constraints, value ranges, and exclusions.

#### Filter Preset

A named, saved **media filter** configuration for quick reuse.

### Schema & Model Details

#### Data Type

The value type of a **tag dimension**: `categorical` (labels), `numerical` (numbers), or `boolean` (true/false).

#### Sticker Display Mode

Controls how a **tag dimension** renders visually on media tiles in the UI: `none` (hidden), `color` (colored badge), or `short` (abbreviated text label).

#### Relative Path

A media file's path relative to the **library path**. Serves as the unique identifier for **media** assets in the database.

#### Library Path

The filesystem directory (`LIBRARY_PATH` env var) where media files are stored. All **relative paths** are resolved against this root.

#### Eligible Media Filter

A **media filter** configured at the **channel** level, defining baseline media eligibility for that channel.

#### Media Filter Overrides

**Schedule-channel**-level filter modifications that are merged with the channel's base **eligible media filter**.

#### Media Posting History

The record of when and where a specific **media** asset has been previously posted across all channels.

### System Internals

#### Scan

The process of discovering and indexing new or modified files in the **library path**. Creates or updates **media** records and generates **thumbnails**.

#### Thumbnail

A generated preview image for a **media** asset, used in the UI for browsing.

#### Drift Prevention

A background process (hourly cron) that detects and cleans up stale or inconsistent **media tags**, maintaining tag data integrity.

---

## Scheduling & Publishing

Content scheduling, post lifecycle, and the automated assignment workflow.

### Domain Concepts

#### Post

A content piece intended for publication to a **channel**. Contains a caption, scheduled date, and one or more **post media** attachments. Progresses through a lifecycle defined by **post status**.

#### Post Status

The lifecycle state of a **post**: `draft`, `ready`, `scheduled`, or `posted`. Transitions between `draft`, `ready`, and `scheduled` are flexible and bidirectional. `posted` is a terminal state.

- `draft` — work in progress, typically needs captioning
- `ready` — caption complete, visible in the **posting queue** (Chrome Extension) for manual publishing
- `scheduled` — assigned a publish time for automatic posting by the **scheduled posts cron**
- `posted` — published to the target platform

#### Channel

A publishing destination (e.g., Fansly, Reddit, Bluesky). Configured with a **channel type**, default **hashtags**, **eligible media filter**, and **cooldown** rules.

#### Channel Type

The platform category of a **channel**: `fansly`, `reddit`, `bluesky`, etc. Determines display properties (color, label) and platform-specific behavior.

#### Content Schedule

_(alias: Schedule)_

A recurring posting pattern that generates **virtual posts** for unfilled time slots. Belongs to one or more **channels** via **schedule channels**. Configured with a **schedule type**, **posts per timeframe**, **preferred days**, and **preferred times**.

#### Schedule Type

The frequency of a **content schedule**: `daily`, `weekly`, or `monthly`.

#### Virtual Post

A placeholder post generated on-demand for an unfilled schedule slot. Marked with `isVirtual = true`. Exists only in API responses — not persisted until filled by **assignment**.

#### Multi-Channel Schedule

A **content schedule** assigned to multiple channels. A single slot produces a **post group** — one post per channel sharing the same media.

#### Assignment

The process of matching eligible **media** to open schedule slots, producing **posts**. Outputs both created posts and **unfilled slots** with reasons. Formerly grouped under a "pipeline" concept.

#### Media Selection

The algorithm within **assignment** that chooses **media** matching filters while respecting **cooldowns** and avoiding duplicates.

#### Caption Queue

An ordered list of **posts** needing captions, enriched with **related posts** for context. The primary workflow surface for content captioning. Formerly grouped under a "pipeline" concept.

#### Related Posts

Posts linked to a **caption queue** item by shared **media** (`relatedByMedia`) or **shoot** (`relatedByShoot`), providing context for consistent captioning.

#### Runway

The number of days a **content schedule** can continue producing posts before exhausting its **available media** supply. Calculated as available media divided by consumption rate. Formerly grouped under a "pipeline" concept.

#### Cooldown

A time-based constraint on posting, originating from Reddit's strict repost rules but now applied across all channels. Has two facets:

- **Post cooldown** (`postCooldownHours`) — minimum time between any posts on a channel
- **Media repost cooldown** (`mediaRepostCooldownHours`) — minimum time before the same media can be reused on a channel

### Schema & Model Details

#### Post Media

A junction entity linking a **post** to **media** with ordering (position) and per-platform analytics. Represents "this media appears in this post at this position."

#### Post Group

A set of posts created simultaneously when a **multi-channel schedule** fills a single slot. Identified by `postGroupId`. All posts in a group share the same media but may have different captions per channel.

#### Schedule Channel

A junction entity linking a **content schedule** to a **channel**, with optional **per-channel overrides** for media filters and sort order.

#### Preferred Days

Days of the week when a weekly or monthly **content schedule** should generate posts.

#### Preferred Times

Specific times of day (HH:MM) when scheduled posts should be published.

#### Posts Per Timeframe

The number of posts a **content schedule** generates per frequency period (e.g., 3 posts per week).

#### Skipped Schedule Slot

A date explicitly marked to suppress post generation for a **content schedule**.

#### Unfilled Slot

A schedule slot that **assignment** could not fill, annotated with a reason: `no_eligible_media` or `no_subreddits`.

#### Available Media

The count of **media** assets eligible for a schedule-channel slot after applying all filters and **cooldown** exclusions.

### System Internals

#### Scheduled Posts Cron

A per-minute background job that checks for posts with `scheduled` status whose publish time has arrived, then dispatches them to their target platforms.

---

## Analytics

Performance tracking and media matching for content optimization. Currently Fansly-specific. Analytics for other platforms may be added in the future but will likely have different metric shapes.

### Domain Concepts

#### Fansly Analytics Datapoint

A single time-series measurement capturing views and engagement for a piece of **media** at a specific moment on Fansly.

#### Fansly Analytics Aggregate

Summary statistics for **media** performance on Fansly: total views, average engagement (seconds and percent), and **FYP performance score**.

#### FYP Metrics

"For You Page" algorithm performance indicators: view velocity, sustained growth, plateau point, and an underperformance flag.

#### FYP Performance Score

A numeric score derived from **FYP metrics** indicating how well content performs in Fansly's algorithmic feed.

#### Fansly Media Candidate

A prospective match between a Fansly platform media item and a library **media** asset, pending confirmation. Candidates are primarily discovered by the **Chrome Extension** via **data capture**.

### Schema & Model Details

#### Candidate Status

Disposition of a **Fansly media candidate**: `pending`, `matched`, or `ignored`.

#### Match Method

How a **Fansly media candidate** was identified: `exact_filename`, `fuzzy_filename`, `manual`, or `auto_detected`.

#### Match Confidence

A numeric score (0–1) indicating certainty of a candidate media match.

#### Analytics Fetch History

Tracks when analytics were last fetched for a media item, supporting rolling and fixed timeframes.

#### Repost Settings

Global analytics-driven configuration for repost behavior: whether to use analytics data, plateau detection parameters (`plateauConsecutiveDays`, `plateauThresholdPercent`, `minDatapointsForPlateau`), and a default media repost cooldown.

---

## Platform Integrations

External services and platform-specific concerns.

### Domain Concepts

#### Chrome Extension

A browser extension serving two distinct roles:

- **Data Capture** — intercepts Fansly timeline data and credentials, buffers items, and syncs **Fansly media candidates** to the server. This role may be reduced over time as the system moves toward a more API-led approach, but will not vanish entirely.
- **Posting Queue** — displays posts with `ready` status for manual publishing to platforms. The primary UI for reviewing and dispatching content that isn't auto-scheduled.

#### Subreddit

A Reddit community configuration. Tracks **verification status**, posting times, member count, **cooldown** rules, and **flair** settings. Linked to Reddit-type **channels**.

#### Verification Status

A **subreddit**'s approval state: `UNKNOWN`, `NOT_NEEDED`, `NEEDED`, `APPLIED`, `VERIFIED`, or `REJECTED`.

#### Flair

A Reddit post category tag. Stored as `defaultFlair` on a **subreddit** and applied during Reddit post submission.

#### Postpone

An external scheduling service used for cross-platform publishing (primarily Bluesky). Posts can be saved as Postpone drafts via GraphQL API.

#### Bluesky Facets

Rich text annotations for Bluesky posts: mentions, hashtags, and links following the AT Protocol facet specification.

#### RedGifs URL

A proxy URL for hosting video content on the RedGifs service. Stored on **media** assets for use in Reddit and other platform posts.

### Schema & Model Details

#### Session Storage

Persisted browser authentication state for Reddit automation. Stores cookies, localStorage, and sessionStorage from authenticated Reddit sessions in a file-based storage system. Has a 24-hour cache invalidation threshold.

#### Subreddit Posting Times

Analytics of historical post timing per day-hour for a **subreddit**, with a score indicating optimal posting windows.

---

## Settings & Configuration

Application-wide settings and credentials.

### Settings

All settings are stored in a JSON file at the application's `APPDATA_PATH`. Settings support partial updates.

#### Theme

Application theme: `light` or `dark`. Default: `dark`.

#### SFW Mode

Safe-for-work content safety mode with multiple sub-settings:

- `sfwMode` (boolean) — master toggle, default: `false`
- `sfwBlurIntensity` (number) — blur level when active, default: `5`
- `sfwDefaultMode` (`off` | `on` | `remember`) — default behavior on load, default: `off`
- `sfwHoverDelay` (number) — milliseconds before unblurring on hover, default: `300`

#### Library Path

Override for the `LIBRARY_PATH` environment variable. When set in settings, takes precedence over the env var.

#### Background Jobs Server URL

URL for an external background jobs processing server. Optional.

#### Repost Settings

Analytics-driven configuration for repost behavior:

- `useAnalytics` (boolean) — whether to factor analytics into repost decisions, default: `false`
- `plateauConsecutiveDays` (integer) — days of flat engagement to detect plateau, default: `5`
- `plateauThresholdPercent` (number) — engagement change threshold for plateau, default: `1.5`
- `minDatapointsForPlateau` (integer) — minimum data points required, default: `7`
- `defaultMediaRepostCooldownHours` (integer) — fallback cooldown in hours, default: `504` (21 days)

### Platform Credentials

#### Bluesky Credentials

- `blueskyUsername` — Bluesky account username
- `blueskyAppPassword` — Bluesky app-specific password
- `blueskyDefaultExpiryDays` — default post expiry duration in days, default: `7`

#### Postpone Token

Authentication token for the **Postpone** scheduling service.

#### Fansly Credentials

Stored separately from main settings with a `_lastUpdated` timestamp:

- `fanslyAuth` — authentication token
- `fanslySessionId` — session identifier
- `fanslyClientCheck` — client verification token
- `fanslyClientId` — client identifier

---

## Glossary Conventions

- Terms in **bold** within definitions reference other glossary entries.
- Enum values are shown in `code formatting`.
- _(alias: X)_ indicates an acceptable alternative name for a term.
