import type { Media, PostStatus } from "@fanslib/server/schemas";
import { useEffect, useState } from "react";

type UseResetOnOpenParams = {
  open: boolean;
  media: Media[];
  initialCaption?: string;
  initialChannelId?: string;
  initialDate?: Date;
  initialStatus?: PostStatus;
  initialSubredditId?: string;
  initialShouldRedirect: boolean;
  scheduleId?: string;
  channels: Array<{ id: string }>;
};

export const useResetOnOpen = ({
  open,
  media,
  initialCaption,
  initialChannelId,
  initialDate,
  initialStatus,
  initialSubredditId,
  initialShouldRedirect,
  scheduleId,
  channels,
}: UseResetOnOpenParams) => {
  const [selectedMedia, setSelectedMedia] = useState<Media[]>(media);
  const [caption, setCaption] = useState(initialCaption ?? "");
  const [selectedChannel, setSelectedChannel] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (initialDate) {
      return new Date(initialDate);
    }
    const defaultDate = new Date();
    defaultDate.setHours(12);
    defaultDate.setMinutes(0);
    defaultDate.setSeconds(0);
    defaultDate.setMilliseconds(0);
    return defaultDate;
  });
  const [status, setStatus] = useState<PostStatus>(initialStatus ?? "draft");
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>(
    initialSubredditId ? [initialSubredditId] : [],
  );
  const [contentScheduleId, setContentScheduleId] = useState<string | null>(scheduleId ?? null);
  const [shouldRedirect, setShouldRedirect] = useState(initialShouldRedirect);

  useEffect(() => {
    if (!open) return;
    setSelectedMedia(media);
  }, [open, media]);

  useEffect(() => {
    if (!open) return;
    setCaption(initialCaption ?? "");
  }, [open, initialCaption]);

  useEffect(() => {
    if (!open) return;
    if (initialChannelId) {
      setSelectedChannel([initialChannelId]);
    } else if (!channels?.length || channels.length > 1) {
      setSelectedChannel([]);
    } else {
      setSelectedChannel([channels[0]?.id ?? ""]);
    }
  }, [channels, initialChannelId, open]);

  useEffect(() => {
    if (!open) return;
    if (initialDate) {
      setSelectedDate(new Date(initialDate));
    } else {
      const defaultDate = new Date();
      defaultDate.setHours(12);
      defaultDate.setMinutes(0);
      defaultDate.setSeconds(0);
      defaultDate.setMilliseconds(0);
      setSelectedDate(defaultDate);
    }
  }, [open, initialDate]);

  useEffect(() => {
    if (!open) return;
    setContentScheduleId(scheduleId ?? null);
  }, [open, scheduleId]);

  useEffect(() => {
    if (!open) return;
    setSelectedSubreddits(initialSubredditId ? [initialSubredditId] : []);
  }, [open, initialSubredditId]);

  useEffect(() => {
    if (!open) return;
    setStatus(initialStatus ?? "draft");
  }, [open, initialStatus]);

  useEffect(() => {
    if (!open) return;
    setShouldRedirect(initialShouldRedirect);
  }, [open, initialShouldRedirect]);

  return {
    selectedMedia,
    setSelectedMedia,
    caption,
    setCaption,
    selectedChannel,
    setSelectedChannel,
    selectedDate,
    setSelectedDate,
    status,
    setStatus,
    selectedSubreddits,
    setSelectedSubreddits,
    contentScheduleId,
    setContentScheduleId,
    shouldRedirect,
    setShouldRedirect,
  };
};
