import * as devalue from "devalue";
import "reflect-metadata";
import { Channel } from "../features/channels/entity";
import { Media } from "../features/library/entity";
import { Post } from "../features/posts/entity";
import { Subreddit } from "../features/subreddits/entity";
import { TagDefinition, TagDimension } from "../features/tags/entity";
import { getTestDataSource } from "../lib/db.test";

export const parseResponse = async <T>(response: Response): Promise<T | null> => {
  const text = await response.text();
  if (text.length === 0) return null;
  return devalue.parse(text) as T;
};

export const createTestMedia = async (overrides: Partial<Media> = {}) => {
  const dataSource = getTestDataSource();
  const repository = dataSource.getRepository(Media);
  
  const timestamp = Date.now();
  const random = Math.random();
  const defaultName = `image-${timestamp}-${random}.jpg`;

  const media = repository.create({
    id: `media-${timestamp}-${random}`,
    relativePath: `/test/path/${defaultName}`,
    type: "image",
    name: defaultName,
    size: 1024,
    fileCreationDate: new Date(),
    fileModificationDate: new Date(),
    ...overrides,
  });

  return repository.save(media);
};

export const createTestChannel = async (overrides: Partial<Channel> = {}) => {
  const dataSource = getTestDataSource();
  const channelRepo = dataSource.getRepository(Channel);
  
  const typeRepo = dataSource.getRepository("ChannelType");
  // eslint-disable-next-line functional/no-let
  let channelType = await typeRepo.findOne({ where: { id: "fansly" } });
  
  if (!channelType) {
    channelType = typeRepo.create({
      id: "fansly",
      name: "Fansly",
    });
    await typeRepo.save(channelType);
  }

  const channel = channelRepo.create({
    name: "Test Channel",
    typeId: "fansly",
    ...overrides,
  });

  return channelRepo.save(channel);
};

export const createTestSubreddit = async (overrides: Partial<Subreddit> = {}) => {
  const dataSource = getTestDataSource();
  const repository = dataSource.getRepository(Subreddit);

  const subreddit = repository.create({
    id: `subreddit-${Date.now()}-${Math.random()}`,
    name: "testsubreddit",
    ...overrides,
  });

  return repository.save(subreddit);
};

export const createTestPost = async (
  channelId?: string,
  overrides: Partial<Post> = {}
) => {
  const dataSource = getTestDataSource();
  const repository = dataSource.getRepository(Post);

  const channel = channelId ? await dataSource.getRepository(Channel).findOne({ where: { id: channelId } }) : await createTestChannel();

  if (!channel) {
    throw new Error(`Channel with id ${channelId} not found`);
  }

  const post = repository.create({
    id: `post-${Date.now()}-${Math.random()}`,
    caption: "Test caption",
    status: "draft",
    channelId: channel.id,
    channel,
    ...overrides,
  });

  return repository.save(post);
};

export const createTestTagDimension = async (overrides: Partial<TagDimension> = {}) => {
  const dataSource = getTestDataSource();
  const repository = dataSource.getRepository(TagDimension);

  const dimension = repository.create({
    name: `Test Dimension ${Date.now()}`,
    dataType: "categorical",
    sortOrder: 0,
    ...overrides,
  });

  return repository.save(dimension);
};

export const createTestTagDefinition = async (
  dimensionId: number,
  overrides: Partial<TagDefinition> = {}
) => {
  const dataSource = getTestDataSource();
  const repository = dataSource.getRepository(TagDefinition);

  const timestamp = Date.now();
  const defaultName = `Test Tag ${timestamp}`;

  const definition = repository.create({
    value: defaultName,
    displayName: defaultName,
    dimensionId,
    color: "#FF0000",
    ...overrides,
  });

  return repository.save(definition);
};

export const logError = () => ({ error }: { error: unknown }) => {
  console.error("❌ Test Error:", error);
  if (error instanceof Error && error.stack) {
    console.error("Stack trace:", error.stack);
  }
  throw error;
};

