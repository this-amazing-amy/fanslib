# FansLib Companion

A minimal Electron application that acts as a companion to the Chrome extension, providing native file system operations.

## Overview

The companion app runs in the system tray and provides an HTTP server (`localhost:6971`) that the Chrome extension can communicate with. This allows the extension to perform native operations like copying files to clipboard and revealing files in Finder—actions that Chrome extensions cannot do directly.

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build
bun run build

# Preview built app
bun run preview
```

## Distribution

### Build for Mac

```bash
bun run dist:mac
```

This creates a DMG file in the `dist` directory.

### Build for Windows

```bash
bun run dist:win
```

This creates an NSIS installer in the `dist` directory.

### Build for both platforms

```bash
bun run dist
```

## How It Works

1. The companion app starts and runs in the system tray (no visible window)
2. An HTTP server listens on `localhost:6971`
3. The Chrome extension sends requests to perform native operations

## API Endpoints

### `GET /health`

Health check endpoint. Returns `{ status: "ok" }`.

### `POST /verify`

Verify if a file exists and get its metadata.

**Request:**

```json
{
  "filePath": "/path/to/file.jpg"
}
```

**Response:**

```json
{
  "exists": true,
  "size": 12345,
  "isFile": true
}
```

### `POST /copy`

Copy files to the system clipboard.

**Request:**

```json
{
  "filePaths": ["/path/to/file1.jpg", "/path/to/file2.jpg"]
}
```

**Response:**

```json
{
  "success": true
}
```

### `POST /reveal`

Reveal a file in Finder (macOS) or Explorer (Windows).

**Request:**

```json
{
  "filePath": "/path/to/file.jpg"
}
```

**Response:**

```json
{
  "success": true
}
```

## Integration with Chrome Extension

The Chrome extension should:

1. Check if the companion is running by calling `GET http://localhost:6971/health`
2. Use `POST /copy` to copy files to clipboard
3. Use `POST /reveal` to show files in Finder/Explorer
4. Handle errors gracefully if the companion is not running

## Icons

Icons are located in `assets/icons/`:

- `icon.png` - Windows icon (256x256 or larger)
- `icon.icns` - macOS icon bundle

Make sure these files exist before building for distribution.
