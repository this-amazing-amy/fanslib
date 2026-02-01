import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { format } from "date-fns";
import "reflect-metadata";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../../lib/test-db";
import { resetAllFixtures } from "../../../lib/test-fixtures";
import { createTestChannel, createTestPost } from "../../../test-utils/setup";
import { ContentSchedule, ScheduleChannel, SkippedScheduleSlot } from "../entity";
import { fetchVirtualPosts, generateScheduleDates } from "./generate-virtual-posts";

describe("generateScheduleDates", () => {
  describe("daily schedules", () => {
    test("generates one slot per day at default time when no preferredTimes", () => {
      const schedule = {
        type: "daily",
        postsPerTimeframe: 1,
        preferredTimes: null,
        preferredDays: null,
      } as ContentSchedule;

      const fromDate = new Date("2026-01-19T00:00:00Z");
      const toDate = new Date("2026-01-21T23:59:59Z");

      const slots = generateScheduleDates(schedule, fromDate, toDate);

      expect(slots.length).toBe(3);
      slots.forEach((slot) => {
        expect(slot.getHours()).toBe(12);
        expect(slot.getMinutes()).toBe(0);
      });
    });

    test("distributes multiple posts evenly across preferred times", () => {
      const schedule = {
        type: "daily",
        postsPerTimeframe: 2,
        preferredTimes: ["09:00", "15:00", "21:00"],
        preferredDays: null,
      } as ContentSchedule;

      const fromDate = new Date("2026-01-19T00:00:00Z");
      const toDate = new Date("2026-01-19T23:59:59Z");

      const slots = generateScheduleDates(schedule, fromDate, toDate);

      expect(slots.length).toBe(2);
      const hours = slots.map((s) => s.getHours());
      expect(hours).toContain(9);
      expect(hours).toContain(15);
    });

    test("caps posts at number of available times", () => {
      const schedule = {
        type: "daily",
        postsPerTimeframe: 5,
        preferredTimes: ["10:00", "14:00"],
        preferredDays: null,
      } as ContentSchedule;

      const fromDate = new Date("2026-01-19T00:00:00Z");
      const toDate = new Date("2026-01-19T23:59:59Z");

      const slots = generateScheduleDates(schedule, fromDate, toDate);

      expect(slots.length).toBe(2);
    });
  });

  describe("weekly schedules", () => {
    test("generates slots for preferred days and times", () => {
      const schedule = {
        type: "weekly",
        postsPerTimeframe: 2,
        preferredTimes: ["11:00"],
        preferredDays: ["Monday", "Wednesday", "Friday"],
      } as ContentSchedule;

      const fromDate = new Date("2026-01-19T00:00:00Z");
      const toDate = new Date("2026-01-25T23:59:59Z");

      const slots = generateScheduleDates(schedule, fromDate, toDate);

      expect(slots.length).toBe(2);
      const days = slots.map((s) => format(s, "EEEE"));
      expect(days).toContain("Monday");
      expect(days).toContain("Wednesday");
    });

    test("evenly distributes across available day+time combinations", () => {
      const schedule = {
        type: "weekly",
        postsPerTimeframe: 3,
        preferredTimes: ["09:00", "18:00"],
        preferredDays: ["Monday", "Wednesday", "Friday"],
      } as ContentSchedule;

      const fromDate = new Date("2026-01-19T00:00:00Z");
      const toDate = new Date("2026-01-25T23:59:59Z");

      const slots = generateScheduleDates(schedule, fromDate, toDate);

      expect(slots.length).toBe(3);
      const allUnique = new Set(slots.map((s) => s.getTime())).size === slots.length;
      expect(allUnique).toBe(true);
    });

    test("distributes across all days when no preferredDays", () => {
      const schedule = {
        type: "weekly",
        postsPerTimeframe: 3,
        preferredTimes: ["12:00"],
        preferredDays: null,
      } as ContentSchedule;

      const fromDate = new Date("2026-01-19T00:00:00Z");
      const toDate = new Date("2026-01-25T23:59:59Z");

      const slots = generateScheduleDates(schedule, fromDate, toDate);

      expect(slots.length).toBe(3);
      const days = new Set(slots.map((s) => format(s, "EEEE")));
      expect(days.size).toBe(3);
    });

    test("single post without preferredDays picks first day of week", () => {
      const schedule = {
        type: "weekly",
        postsPerTimeframe: 1,
        preferredTimes: ["12:00"],
        preferredDays: null,
      } as ContentSchedule;

      const fromDate = new Date("2026-01-19T00:00:00Z");
      const toDate = new Date("2026-01-25T23:59:59Z");

      const slots = generateScheduleDates(schedule, fromDate, toDate);

      expect(slots.length).toBe(1);
    });
  });

  describe("monthly schedules", () => {
    test("distributes posts evenly across month (1st and 3rd Friday for 2 posts)", () => {
      const schedule = {
        type: "monthly",
        postsPerTimeframe: 2,
        preferredTimes: ["11:00"],
        preferredDays: ["Friday"],
      } as ContentSchedule;

      const fromDate = new Date("2026-01-01T00:00:00Z");
      const toDate = new Date("2026-01-31T23:59:59Z");

      const slots = generateScheduleDates(schedule, fromDate, toDate);

      expect(slots.length).toBe(2);

      const fridays = slots.map((s) => {
        const dayOfMonth = s.getDate();
        return Math.ceil(dayOfMonth / 7);
      });

      expect(fridays).toContain(1);
      expect(fridays).toContain(3);
    });

    test("distributes 3 posts evenly across 4 Fridays", () => {
      const schedule = {
        type: "monthly",
        postsPerTimeframe: 3,
        preferredTimes: ["11:00"],
        preferredDays: ["Friday"],
      } as ContentSchedule;

      const fromDate = new Date("2026-01-01T00:00:00Z");
      const toDate = new Date("2026-01-31T23:59:59Z");

      const slots = generateScheduleDates(schedule, fromDate, toDate);

      expect(slots.length).toBe(3);

      const allUnique = new Set(slots.map((s) => s.getTime())).size === slots.length;
      expect(allUnique).toBe(true);
    });

    test("distributes across all days when no preferredDays", () => {
      const schedule = {
        type: "monthly",
        postsPerTimeframe: 4,
        preferredTimes: ["12:00"],
        preferredDays: null,
      } as ContentSchedule;

      const fromDate = new Date("2026-01-01T00:00:00Z");
      const toDate = new Date("2026-01-31T23:59:59Z");

      const slots = generateScheduleDates(schedule, fromDate, toDate);

      expect(slots.length).toBe(4);
      const uniqueDates = new Set(slots.map((s) => s.getDate()));
      expect(uniqueDates.size).toBe(4);

      const sortedDates = slots.map((s) => s.getDate()).sort((a, b) => a - b);
      expect(sortedDates[0]).toBeLessThanOrEqual(8);
      expect(sortedDates[3]).toBeGreaterThanOrEqual(24);
    });

    test("single post without preferredDays picks first day of month", () => {
      const schedule = {
        type: "monthly",
        postsPerTimeframe: 1,
        preferredTimes: ["12:00"],
        preferredDays: null,
      } as ContentSchedule;

      const fromDate = new Date("2026-01-01T00:00:00Z");
      const toDate = new Date("2026-01-31T23:59:59Z");

      const slots = generateScheduleDates(schedule, fromDate, toDate);

      expect(slots.length).toBe(1);
      const firstSlot = slots[0];
      expect(firstSlot).toBeDefined();
      expect(firstSlot?.getDate()).toBe(1);
    });
  });

  describe("no duplicate slots", () => {
    test("weekly schedule with single day/time produces unique slots", () => {
      const schedule = {
        type: "weekly",
        postsPerTimeframe: 5,
        preferredTimes: ["11:00"],
        preferredDays: ["Sunday"],
      } as ContentSchedule;

      const fromDate = new Date("2026-01-19T00:00:00Z");
      const toDate = new Date("2026-02-09T23:59:59Z");

      const slots = generateScheduleDates(schedule, fromDate, toDate);

      const uniqueTimestamps = new Set(slots.map((s) => s.getTime()));
      expect(uniqueTimestamps.size).toBe(slots.length);
    });

    test("monthly schedule with single day/time produces unique slots", () => {
      const schedule = {
        type: "monthly",
        postsPerTimeframe: 5,
        preferredTimes: ["11:00"],
        preferredDays: ["Friday"],
      } as ContentSchedule;

      const fromDate = new Date("2026-01-01T00:00:00Z");
      const toDate = new Date("2026-02-28T23:59:59Z");

      const slots = generateScheduleDates(schedule, fromDate, toDate);

      const uniqueTimestamps = new Set(slots.map((s) => s.getTime()));
      expect(uniqueTimestamps.size).toBe(slots.length);
    });
  });
});

describe("fetchVirtualPosts", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  test("returns empty array when no schedules exist for channels", async () => {
    const channel = await createTestChannel();

    const virtualPosts = await fetchVirtualPosts({
      channelIds: [channel.id],
      fromDate: "2026-01-19T00:00:00Z",
      toDate: "2026-01-25T23:59:59Z",
    });

    expect(virtualPosts).toEqual([]);
  });

  test("generates virtual posts for schedule", async () => {
    const channel = await createTestChannel();
    const dataSource = getTestDataSource();
    const scheduleRepo = dataSource.getRepository(ContentSchedule);

    const schedule = scheduleRepo.create({
      id: "test-schedule",
      channelId: channel.id,
      name: "Test Weekly",
      type: "weekly",
      postsPerTimeframe: 1,
      preferredDays: ["Monday"],
      preferredTimes: ["12:00"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await scheduleRepo.save(schedule);

    const virtualPosts = await fetchVirtualPosts({
      channelIds: [channel.id],
      fromDate: "2026-01-19T00:00:00Z",
      toDate: "2026-01-25T23:59:59Z",
    });

    expect(virtualPosts.length).toBe(1);
    expect(virtualPosts[0]?.isVirtual).toBe(true);
    expect(virtualPosts[0]?.scheduleId).toBe("test-schedule");
    expect(virtualPosts[0]?.channelId).toBe(channel.id);
  });

  test("excludes slots where posts already exist", async () => {
    const channel = await createTestChannel();
    const dataSource = getTestDataSource();
    const scheduleRepo = dataSource.getRepository(ContentSchedule);

    const schedule = scheduleRepo.create({
      id: "test-schedule-existing",
      channelId: channel.id,
      name: "Test Weekly",
      type: "weekly",
      postsPerTimeframe: 2,
      preferredDays: ["Monday", "Wednesday"],
      preferredTimes: ["12:00"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await scheduleRepo.save(schedule);

    await createTestPost(channel.id, {
      scheduleId: "test-schedule-existing",
      date: new Date("2026-01-20T12:00:00.000Z"),
    });

    const virtualPosts = await fetchVirtualPosts({
      channelIds: [channel.id],
      fromDate: "2026-01-19T00:00:00Z",
      toDate: "2026-01-25T23:59:59Z",
    });

    const mondaySlot = virtualPosts.find((p) =>
      p.date.toISOString().includes("2026-01-20")
    );
    expect(mondaySlot).toBeUndefined();
  });

  test("excludes skipped slots", async () => {
    const channel = await createTestChannel();
    const dataSource = getTestDataSource();
    const scheduleRepo = dataSource.getRepository(ContentSchedule);
    const skippedRepo = dataSource.getRepository(SkippedScheduleSlot);

    const schedule = scheduleRepo.create({
      id: "test-schedule-skipped",
      channelId: channel.id,
      name: "Test Weekly",
      type: "weekly",
      postsPerTimeframe: 2,
      preferredDays: ["Monday", "Wednesday"],
      preferredTimes: ["12:00"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await scheduleRepo.save(schedule);

    const skipped = skippedRepo.create({
      scheduleId: "test-schedule-skipped",
      date: new Date("2026-01-20T12:00:00.000Z"),
    });
    await skippedRepo.save(skipped);

    const virtualPosts = await fetchVirtualPosts({
      channelIds: [channel.id],
      fromDate: "2026-01-19T00:00:00Z",
      toDate: "2026-01-25T23:59:59Z",
    });

    const mondaySlot = virtualPosts.find((p) =>
      p.date.toISOString().includes("2026-01-20")
    );
    expect(mondaySlot).toBeUndefined();
  });

  test("virtual posts have correct shape", async () => {
    const channel = await createTestChannel();
    const dataSource = getTestDataSource();
    const scheduleRepo = dataSource.getRepository(ContentSchedule);

    const schedule = scheduleRepo.create({
      id: "test-schedule-shape",
      channelId: channel.id,
      name: "Shape Test",
      emoji: "📅",
      color: "#ff0000",
      type: "daily",
      postsPerTimeframe: 1,
      preferredTimes: ["10:00"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await scheduleRepo.save(schedule);

    const virtualPosts = await fetchVirtualPosts({
      channelIds: [channel.id],
      fromDate: "2026-01-19T00:00:00Z",
      toDate: "2026-01-19T23:59:59Z",
    });

    expect(virtualPosts.length).toBe(1);
    const post = virtualPosts[0];
    expect(post).toBeDefined();

    expect(post?.isVirtual).toBe(true);
    expect(post?.status).toBe("draft");
    expect(post?.caption).toBe("");
    expect(post?.postMedia).toEqual([]);
    expect(post?.subreddit).toBeNull();
    expect(post?.scheduleId).toBe("test-schedule-shape");
    expect(post?.schedule?.name).toBe("Shape Test");
    expect(post?.schedule?.emoji).toBe("📅");
    expect(post?.schedule?.color).toBe("#ff0000");
    expect(post?.id).toMatch(/^virtual-/);
  });
});

describe("fetchVirtualPosts - multi-channel schedules", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  test("schedule with multiple channels generates virtual post per channel", async () => {
    const channel1 = await createTestChannel({ name: "YouTube" });
    const channel2 = await createTestChannel({ name: "TikTok" });
    const channel3 = await createTestChannel({ name: "Instagram" });
    const dataSource = getTestDataSource();
    const scheduleRepo = dataSource.getRepository(ContentSchedule);
    const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);

    const schedule = scheduleRepo.create({
      id: "multi-channel-schedule",
      channelId: null,
      name: "Full-length Video",
      type: "weekly",
      postsPerTimeframe: 1,
      preferredDays: ["Monday"],
      preferredTimes: ["12:00"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await scheduleRepo.save(schedule);

    const scheduleChannels = [channel1, channel2, channel3].map((ch, index) =>
      scheduleChannelRepo.create({
        scheduleId: "multi-channel-schedule",
        channelId: ch.id,
        sortOrder: index,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
    await scheduleChannelRepo.save(scheduleChannels);

    const virtualPosts = await fetchVirtualPosts({
      channelIds: [channel1.id, channel2.id, channel3.id],
      fromDate: "2026-01-19T00:00:00Z",
      toDate: "2026-01-25T23:59:59Z",
    });

    expect(virtualPosts.length).toBe(3);

    const channelIds = virtualPosts.map((p) => p.channelId);
    expect(channelIds).toContain(channel1.id);
    expect(channelIds).toContain(channel2.id);
    expect(channelIds).toContain(channel3.id);

    virtualPosts.forEach((post) => {
      expect(post.scheduleId).toBe("multi-channel-schedule");
      expect(post.isVirtual).toBe(true);
    });
  });

  test("multi-channel schedule virtual posts share postGroupId", async () => {
    const channel1 = await createTestChannel({ name: "Channel A" });
    const channel2 = await createTestChannel({ name: "Channel B" });
    const dataSource = getTestDataSource();
    const scheduleRepo = dataSource.getRepository(ContentSchedule);
    const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);

    const schedule = scheduleRepo.create({
      id: "grouped-schedule",
      channelId: null,
      name: "Grouped Content",
      type: "daily",
      postsPerTimeframe: 1,
      preferredTimes: ["14:00"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await scheduleRepo.save(schedule);

    await scheduleChannelRepo.save([
      scheduleChannelRepo.create({
        scheduleId: "grouped-schedule",
        channelId: channel1.id,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      scheduleChannelRepo.create({
        scheduleId: "grouped-schedule",
        channelId: channel2.id,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ]);

    const virtualPosts = await fetchVirtualPosts({
      channelIds: [channel1.id, channel2.id],
      fromDate: "2026-01-19T00:00:00Z",
      toDate: "2026-01-19T23:59:59Z",
    });

    expect(virtualPosts.length).toBe(2);

    const postGroupIds = virtualPosts.map((p) => p.postGroupId);
    expect(postGroupIds[0]).not.toBeNull();
    expect(postGroupIds[0]).toBe(postGroupIds[1]);
  });

  test("single-channel schedule has null postGroupId", async () => {
    const channel = await createTestChannel();
    const dataSource = getTestDataSource();
    const scheduleRepo = dataSource.getRepository(ContentSchedule);
    const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);

    const schedule = scheduleRepo.create({
      id: "single-channel-new",
      channelId: null,
      name: "Single Channel",
      type: "daily",
      postsPerTimeframe: 1,
      preferredTimes: ["10:00"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await scheduleRepo.save(schedule);

    await scheduleChannelRepo.save(
      scheduleChannelRepo.create({
        scheduleId: "single-channel-new",
        channelId: channel.id,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    const virtualPosts = await fetchVirtualPosts({
      channelIds: [channel.id],
      fromDate: "2026-01-19T00:00:00Z",
      toDate: "2026-01-19T23:59:59Z",
    });

    expect(virtualPosts.length).toBe(1);
    expect(virtualPosts[0]?.postGroupId).toBeNull();
  });

  test("filters virtual posts by requested channelIds", async () => {
    const channel1 = await createTestChannel({ name: "Requested" });
    const channel2 = await createTestChannel({ name: "Not Requested" });
    const dataSource = getTestDataSource();
    const scheduleRepo = dataSource.getRepository(ContentSchedule);
    const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);

    const schedule = scheduleRepo.create({
      id: "filter-test-schedule",
      channelId: null,
      name: "Filter Test",
      type: "daily",
      postsPerTimeframe: 1,
      preferredTimes: ["12:00"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await scheduleRepo.save(schedule);

    await scheduleChannelRepo.save([
      scheduleChannelRepo.create({
        scheduleId: "filter-test-schedule",
        channelId: channel1.id,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      scheduleChannelRepo.create({
        scheduleId: "filter-test-schedule",
        channelId: channel2.id,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ]);

    const virtualPosts = await fetchVirtualPosts({
      channelIds: [channel1.id],
      fromDate: "2026-01-19T00:00:00Z",
      toDate: "2026-01-19T23:59:59Z",
    });

    expect(virtualPosts.length).toBe(1);
    expect(virtualPosts[0]?.channelId).toBe(channel1.id);
  });

  test("excludes slot for specific channel when post exists", async () => {
    const channel1 = await createTestChannel({ name: "With Post" });
    const channel2 = await createTestChannel({ name: "Without Post" });
    const dataSource = getTestDataSource();
    const scheduleRepo = dataSource.getRepository(ContentSchedule);
    const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);

    const schedule = scheduleRepo.create({
      id: "partial-filled-schedule",
      channelId: null,
      name: "Partial Filled",
      type: "daily",
      postsPerTimeframe: 1,
      preferredTimes: ["12:00"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await scheduleRepo.save(schedule);

    await scheduleChannelRepo.save([
      scheduleChannelRepo.create({
        scheduleId: "partial-filled-schedule",
        channelId: channel1.id,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      scheduleChannelRepo.create({
        scheduleId: "partial-filled-schedule",
        channelId: channel2.id,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ]);

    await createTestPost(channel1.id, {
      scheduleId: "partial-filled-schedule",
      date: new Date("2026-01-19T12:00:00.000Z"),
    });

    const virtualPosts = await fetchVirtualPosts({
      channelIds: [channel1.id, channel2.id],
      fromDate: "2026-01-19T00:00:00Z",
      toDate: "2026-01-19T23:59:59Z",
    });

    expect(virtualPosts.length).toBe(1);
    expect(virtualPosts[0]?.channelId).toBe(channel2.id);
  });

  test("targetChannelIds contains all channels in schedule", async () => {
    const channel1 = await createTestChannel({ name: "Target 1" });
    const channel2 = await createTestChannel({ name: "Target 2" });
    const channel3 = await createTestChannel({ name: "Target 3" });
    const dataSource = getTestDataSource();
    const scheduleRepo = dataSource.getRepository(ContentSchedule);
    const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);

    const schedule = scheduleRepo.create({
      id: "target-channels-schedule",
      channelId: null,
      name: "Target Channels Test",
      type: "daily",
      postsPerTimeframe: 1,
      preferredTimes: ["12:00"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await scheduleRepo.save(schedule);

    await scheduleChannelRepo.save([
      scheduleChannelRepo.create({
        scheduleId: "target-channels-schedule",
        channelId: channel1.id,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      scheduleChannelRepo.create({
        scheduleId: "target-channels-schedule",
        channelId: channel2.id,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      scheduleChannelRepo.create({
        scheduleId: "target-channels-schedule",
        channelId: channel3.id,
        sortOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ]);

    const virtualPosts = await fetchVirtualPosts({
      channelIds: [channel1.id, channel2.id],
      fromDate: "2026-01-19T00:00:00Z",
      toDate: "2026-01-19T23:59:59Z",
    });

    expect(virtualPosts.length).toBe(2);

    virtualPosts.forEach((post) => {
      expect(post.targetChannelIds).toBeDefined();
      expect(post.targetChannelIds?.length).toBe(2);
      expect(post.targetChannelIds).toContain(channel1.id);
      expect(post.targetChannelIds).toContain(channel2.id);
    });
  });

  test("legacy channelId schedule still works alongside new scheduleChannels", async () => {
    const legacyChannel = await createTestChannel({ name: "Legacy Channel" });
    const dataSource = getTestDataSource();
    const scheduleRepo = dataSource.getRepository(ContentSchedule);

    const schedule = scheduleRepo.create({
      id: "legacy-schedule",
      channelId: legacyChannel.id,
      name: "Legacy Schedule",
      type: "daily",
      postsPerTimeframe: 1,
      preferredTimes: ["09:00"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await scheduleRepo.save(schedule);

    const virtualPosts = await fetchVirtualPosts({
      channelIds: [legacyChannel.id],
      fromDate: "2026-01-19T00:00:00Z",
      toDate: "2026-01-19T23:59:59Z",
    });

    expect(virtualPosts.length).toBe(1);
    expect(virtualPosts[0]?.channelId).toBe(legacyChannel.id);
    expect(virtualPosts[0]?.scheduleId).toBe("legacy-schedule");
  });

  test("multi-channel schedule with 2 posts/day generates correct slots", async () => {
    const channel1 = await createTestChannel({ name: "Multi A" });
    const channel2 = await createTestChannel({ name: "Multi B" });
    const dataSource = getTestDataSource();
    const scheduleRepo = dataSource.getRepository(ContentSchedule);
    const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);

    const schedule = scheduleRepo.create({
      id: "multi-posts-schedule",
      channelId: null,
      name: "Multiple Posts Per Day",
      type: "daily",
      postsPerTimeframe: 2,
      preferredTimes: ["10:00", "18:00"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await scheduleRepo.save(schedule);

    await scheduleChannelRepo.save([
      scheduleChannelRepo.create({
        scheduleId: "multi-posts-schedule",
        channelId: channel1.id,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      scheduleChannelRepo.create({
        scheduleId: "multi-posts-schedule",
        channelId: channel2.id,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ]);

    const virtualPosts = await fetchVirtualPosts({
      channelIds: [channel1.id, channel2.id],
      fromDate: "2026-01-19T00:00:00Z",
      toDate: "2026-01-19T23:59:59Z",
    });

    expect(virtualPosts.length).toBe(4);

    const channel1Posts = virtualPosts.filter((p) => p.channelId === channel1.id);
    const channel2Posts = virtualPosts.filter((p) => p.channelId === channel2.id);

    expect(channel1Posts.length).toBe(2);
    expect(channel2Posts.length).toBe(2);

    const channel1Hours = channel1Posts.map((p) => p.date.getHours()).sort();
    expect(channel1Hours).toEqual([10, 18]);
  });

  test("skipped slot affects all channels in schedule", async () => {
    const channel1 = await createTestChannel({ name: "Skip A" });
    const channel2 = await createTestChannel({ name: "Skip B" });
    const dataSource = getTestDataSource();
    const scheduleRepo = dataSource.getRepository(ContentSchedule);
    const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);
    const skippedRepo = dataSource.getRepository(SkippedScheduleSlot);

    const schedule = scheduleRepo.create({
      id: "skipped-multi-schedule",
      channelId: null,
      name: "Skipped Multi",
      type: "daily",
      postsPerTimeframe: 1,
      preferredTimes: ["12:00"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await scheduleRepo.save(schedule);

    await scheduleChannelRepo.save([
      scheduleChannelRepo.create({
        scheduleId: "skipped-multi-schedule",
        channelId: channel1.id,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      scheduleChannelRepo.create({
        scheduleId: "skipped-multi-schedule",
        channelId: channel2.id,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ]);

    await skippedRepo.save(
      skippedRepo.create({
        scheduleId: "skipped-multi-schedule",
        date: new Date("2026-01-19T12:00:00.000Z"),
      })
    );

    const virtualPosts = await fetchVirtualPosts({
      channelIds: [channel1.id, channel2.id],
      fromDate: "2026-01-19T00:00:00Z",
      toDate: "2026-01-19T23:59:59Z",
    });

    expect(virtualPosts.length).toBe(0);
  });
});
