import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * @deprecated This route is deprecated. Subreddit management has been consolidated
 * into the Channels page at /content/channels. Reddit channels (subreddits) are now
 * managed as channels with typeId='reddit'.
 *
 * This redirect preserves backward compatibility for any bookmarks or external links.
 */
export const Route = createFileRoute('/subreddits')({
	beforeLoad: () => {
		throw redirect({
			to: '/content/channels',
		});
	},
});
