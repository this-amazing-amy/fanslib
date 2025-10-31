import { router } from '../server';
import { channelsRouter } from './channels';
import { filterPresetsRouter } from './filter-presets';
import { hashtagsRouter } from './hashtags';
import { mediaRouter } from './media';
import { mediaTagsRouter } from './media-tags';
import { postsRouter } from './posts';
import { schedulesRouter } from './schedules';
import { shootsRouter } from './shoots';
import { snippetsRouter } from './snippets';
import { subredditsRouter } from './subreddits';
import { tagDefinitionsRouter } from './tag-definitions';
import { tagDimensionsRouter } from './tag-dimensions';

export const trpcRouter = router({
  media: mediaRouter,
  shoots: shootsRouter,
  posts: postsRouter,
  channels: channelsRouter,
  subreddits: subredditsRouter,
  tagDimensions: tagDimensionsRouter,
  tagDefinitions: tagDefinitionsRouter,
  mediaTags: mediaTagsRouter,
  schedules: schedulesRouter,
  snippets: snippetsRouter,
  hashtags: hashtagsRouter,
  filterPresets: filterPresetsRouter,
});
export type TRPCRouter = typeof trpcRouter;
