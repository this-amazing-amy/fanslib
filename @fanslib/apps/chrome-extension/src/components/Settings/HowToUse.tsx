export const HowToUse = () => (
  <div className='bg-base-200 rounded-xl p-6'>
    <h2 className='text-lg font-semibold mb-4'>How to Use</h2>
    <ol className='space-y-3 text-sm text-base-content/80 list-decimal list-inside'>
      <li>Ensure the FansLib server is running (default: localhost:6970)</li>
      <li>
        Enter the full absolute path to your library folder (e.g.,
        /Users/you/Pictures/library)
      </li>
      <li>
        Click &quot;Verify Folder Access&quot; and select your library folder to
        confirm it works
      </li>
      <li>Save your settings</li>
      <li>Add posts to the queue from the FansLib web interface</li>
      <li>Open the extension popup on Fansly.com to see queued posts</li>
      <li>
        Drag and drop media thumbnails directly to Fansly&apos;s upload area
      </li>
    </ol>
  </div>
);
