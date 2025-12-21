# Chrome Extension Development

## Development Workflow

### Option 1: Manual Reload (Current)

1. Run `bun run dev` to watch for changes
2. When files change, manually reload the extension in Chrome:
   - Go to `chrome://extensions/`
   - Click the reload icon on your extension

### Option 2: Use Extension Reloader (Recommended)

Install the [Extension Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid) Chrome extension, which can auto-reload extensions when files change.

### Option 3: Use Chrome Extension CLI (Advanced)

Install `chrome-extension-cli` globally:

```bash
npm install -g chrome-extension-cli
```

Then use:

```bash
chrome-extension-cli reload
```

## Debugging

The extension includes comprehensive debug logging for the statistics functionality. See [DEBUGGING.md](./DEBUGGING.md) for:

- How to view logs for each component (Content Script, Background Script, Popup)
- Understanding log formats and levels
- Common debugging scenarios
- Troubleshooting guide

**Quick start**:

- Content script logs: Open DevTools on fansly.com, filter by `FansLib:Interceptor`
- Background script logs: `chrome://extensions/` → Developer mode → "Inspect views: background page"
- Popup logs: Right-click popup → Inspect, filter by `FansLib:Extension`

## Common Issues

### CSS/Padding Not Applied

1. **Clear Chrome cache**: Hard refresh the extension popup (Ctrl+Shift+R or Cmd+Shift+R)
2. **Rebuild**: Stop and restart `bun run dev`
3. **Check build output**: Ensure `dist/` contains the latest CSS files
4. **Verify CSS import**: Check that `styles.css` is imported in your entry files

### Styles Not Updating

- Chrome extensions cache aggressively. Try:
  1. Close and reopen the popup
  2. Reload the extension completely
  3. Clear browser cache for the extension

### Statistics Not Updating

See the [DEBUGGING.md](./DEBUGGING.md) guide for detailed troubleshooting steps.
