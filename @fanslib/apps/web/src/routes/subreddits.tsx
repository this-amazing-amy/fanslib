import { createFileRoute } from '@tanstack/react-router';
import { SubredditsPage } from '~/features/subreddits/SubredditsPage';

export const Route = createFileRoute('/subreddits')({
  component: SubredditsPage,
});
