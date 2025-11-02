export const FIND_REDGIFS_URL = `
  query FindRedgifsURL($filename: String!) {
    media(search: $filename) {
      objects {
        name
        hostedUrl
      }
    }
  }
`;

export const FIND_SUBREDDIT_POSTING_TIMES = `
  query FindSubredditPostingTimes($subreddit: String!, $timezone: String!) {
    analytics(subreddit: $subreddit, timezone: $timezone) {
      id
      subreddit
      posts {
        day
        hour
        posts
        __typename
      }
      __typename
    }
  }
`;

export const SCHEDULE_BLUESKY_POST = `
  mutation ScheduleBlueskyPost($input: ScheduleBlueskyPostInput!) {
    scheduleBlueskyPost(input: $input) {
      success
      errors {
        message
      }
    }
  }
`;



