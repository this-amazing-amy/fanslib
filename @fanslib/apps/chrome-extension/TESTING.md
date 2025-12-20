# Testing Chrome Extension Without Loading It

This guide explains how to test the Chrome extension functionality (especially the "Mark posted" feature) without loading it as an extension.

## Quick Start

1. **Start the dev server:**

   ```bash
   cd @fanslib/apps/chrome-extension
   bun dev
   ```

2. **Open the test page:**
   Navigate to `http://localhost:5173/test-popup.html` (or whatever port Vite assigns)

3. **Configure settings in browser console:**

   ```javascript
   localStorage.setItem('fanslib_api_url', 'http://localhost:6970');
   localStorage.setItem('fanslib_web_url', 'http://localhost:6969');
   localStorage.setItem('fanslib_bridge_url', 'http://localhost:6971');
   localStorage.setItem('fanslib_library_path', '/path/to/your/library');
   ```

4. **Reload the page** to load posts

5. **Test "Mark posted":**
   - Click the "Mark Posted" button on any post
   - Check the browser console for any errors
   - Check the Network tab to see the API request
   - Verify the post status changes in the API

## How It Works

The test page (`test-popup.html`) uses:

- **Mock Chrome APIs**: `chrome.storage` and `chrome.runtime` are mocked to use `localStorage` and console warnings
- **Same React Components**: Uses the exact same `Popup` component as the real extension
- **Same API Calls**: Makes the same Eden treaty API calls to your server

## Debugging "Mark Posted" Issues

### Check Browser Console

The improved error handling will show:

- API errors with full error messages
- Network request failures
- Any exceptions during the update

### Check Network Tab

Look for the PATCH request to `/api/posts/by-id/:id`:

- **Status code**: Should be 200
- **Request body**: Should contain `{ status: 'posted' }`
- **Response**: Should return the updated post

### Common Issues

1. **CORS errors**: Make sure your server allows requests from `localhost:5173`
2. **API URL incorrect**: Check `localStorage.getItem('fanslib_api_url')`
3. **Post not found**: Verify the post ID exists in your database
4. **Network errors**: Ensure the server is running on the configured port

## Testing Different Scenarios

### Test with no posts:

```javascript
// The UI will show "No posts ready"
```

### Test with error state:

```javascript
// Set invalid API URL
localStorage.setItem('fanslib_api_url', 'http://invalid-url:9999');
// Reload page - should show error
```

### Test successful update:

```javascript
// Set correct API URL
localStorage.setItem('fanslib_api_url', 'http://localhost:6970');
// Click "Mark Posted" - should update and reload posts
```

## Files

- `test-popup.html` - Standalone test page
- `src/test-popup.tsx` - Entry point with Chrome API mocks
- `src/lib/storage-mock.ts` - Alternative storage implementation (not used, but available)
