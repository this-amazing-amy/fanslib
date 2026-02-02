import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { validationError, notFound } from "../../lib/hono-utils";
import { AddMediaToPostRequestBodySchema, addMediaToPost } from "./operations/post-media/add";
import { RemoveMediaFromPostRequestBodySchema, removeMediaFromPost } from "./operations/post-media/remove";
import { UpdatePostMediaRequestBodySchema, updatePostMedia } from "./operations/post-media/update";
import { CreatePostRequestBodySchema, createPost } from "./operations/post/create";
import { deletePost } from "./operations/post/delete";
import { fetchAllPosts } from "./operations/post/fetch-all";
import { fetchPostsByChannel } from "./operations/post/fetch-by-channel";
import { fetchPostById } from "./operations/post/fetch-by-id";
import { fetchPostsByMediaId } from "./operations/post/fetch-by-media-id";
import { FetchRecentPostsRequestSchema, fetchRecentPosts } from "./operations/post/fetch-recent";
import { UpdatePostRequestBodySchema, updatePost } from "./operations/post/update";
import { PostFiltersSchema } from "./schemas/post-filters";

const FetchAllPostsQuerySchema = z.object({
  filters: z.string().optional(),
});

export const postsRoutes = new Hono()
  .basePath("/api/posts")
  .get("/all", zValidator("query", FetchAllPostsQuerySchema, validationError), async (c) => {
    const { filters: filtersString } = c.req.valid("query");
    const filters = filtersString ? PostFiltersSchema.parse(JSON.parse(filtersString)) : undefined;
    const result = await fetchAllPosts(filters);
    return c.json(result);
  })
  .get("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const post = await fetchPostById(id);
    if (!post) {
      return notFound(c, "Post not found");
    }
    return c.json(post);
  })
  .get("/by-channel-id/:channelId", async (c) => {
    const channelId = c.req.param("channelId");
    const posts = await fetchPostsByChannel(channelId);
    return c.json(posts);
  })
  .get("/by-media-id/:mediaId", async (c) => {
    const mediaId = c.req.param("mediaId");
    const posts = await fetchPostsByMediaId(mediaId);
    return c.json(posts);
  })
  .get("/recent", zValidator("query", FetchRecentPostsRequestSchema, validationError), async (c) => {
    const params = c.req.valid("query");
    const posts = await fetchRecentPosts(params);
    return c.json(posts);
  })
  .post("/", zValidator("json", CreatePostRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const { mediaIds, ...postData } = body;
    const result = await createPost(postData, mediaIds ?? []);
    return c.json(result);
  })
  .patch("/by-id/:id", zValidator("json", UpdatePostRequestBodySchema, validationError), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const post = await updatePost(id, body);
    if (!post) {
      return notFound(c, "Post not found");
    }
    return c.json(post);
  })
  .delete("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const success = await deletePost(id);
    if (!success) {
      return notFound(c, "Post not found");
    }
    return c.json({ success: true });
  })
  .post("/by-id/:id/media", zValidator("json", AddMediaToPostRequestBodySchema, validationError), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const post = await addMediaToPost(id, body.mediaIds);
    if (!post) {
      return notFound(c, "Post not found");
    }
    return c.json(post);
  })
  .delete("/by-id/:id/media", zValidator("json", RemoveMediaFromPostRequestBodySchema, validationError), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const post = await removeMediaFromPost(id, body.mediaIds);
    if (!post) {
      return notFound(c, "Post not found");
    }
    return c.json(post);
  })
  .patch("/by-id/:id/media/:postMediaId", zValidator("json", UpdatePostMediaRequestBodySchema, validationError), async (c) => {
    const id = c.req.param("id");
    const postMediaId = c.req.param("postMediaId");
    const body = c.req.valid("json");
    const postMedia = await updatePostMedia(id, postMediaId, body);
    if (!postMedia) {
      return notFound(c, "PostMedia not found");
    }
    return c.json(postMedia);
  });

