# FansLib Bridge

A minimal Electron application that acts as a bridge between the Chrome extension and the local file system, enabling drag-and-drop operations.

## Overview

The bridge app runs in the system tray and provides an HTTP server (`localhost:6971`) that the Chrome extension can communicate with to initiate drag operations. This allows the extension to drag local files to external applications (like Fansly) even though Chrome extensions cannot directly access the file system.

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

1. The bridge app starts and runs in the system tray (no visible window)
2. It creates a hidden 1x1 pixel window for drag operations
3. An HTTP server listens on `localhost:6971`
4. When the Chrome extension needs to drag files:
   - It sends a POST request to `http://localhost:6971/drag` with file paths
   - The bridge app uses Electron's native drag API via the hidden window
   - Files can then be dragged to any application

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

### `POST /drag`

Initiate a drag operation with the specified files.

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

## Integration with Chrome Extension

The Chrome extension should:

1. Check if the bridge is running by calling `GET http://localhost:6971/health`
2. When dragging starts, send file paths to `POST http://localhost:6971/drag`
3. Handle errors gracefully if the bridge is not running

## Icons

Icons are located in `assets/icons/`:

- `icon.png` - Windows icon (256x256 or larger)
- `icon.icns` - macOS icon bundle

Make sure these files exist before building for distribution.
