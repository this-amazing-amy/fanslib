import { Elysia, t } from "elysia";
import { AddMediaToPostRequestBodySchema, AddMediaToPostRequestParamsSchema, AddMediaToPostResponseSchema, addMediaToPost } from "./operations/post-media/add";
import { RemoveMediaFromPostRequestBodySchema, RemoveMediaFromPostRequestParamsSchema, RemoveMediaFromPostResponseSchema, removeMediaFromPost } from "./operations/post-media/remove";
import { UpdatePostMediaRequestBodySchema, UpdatePostMediaRequestParamsSchema, UpdatePostMediaResponseSchema, updatePostMedia } from "./operations/post-media/update";
import { CreatePostRequestBodySchema, CreatePostResponseSchema, createPost } from "./operations/post/create";
import { DeletePostRequestParamsSchema, DeletePostResponseSchema, deletePost } from "./operations/post/delete";
import { FetchAllPostsRequestQuerySchema, FetchAllPostsResponseSchema, fetchAllPosts } from "./operations/post/fetch-all";
import { FetchPostsByChannelResponseSchema, fetchPostsByChannel } from "./operations/post/fetch-by-channel";
import { FetchPostByIdRequestParamsSchema, FetchPostByIdResponseSchema, fetchPostById } from "./operations/post/fetch-by-id";
import { FetchPostsByMediaIdRequestParamsSchema, FetchPostsByMediaIdResponseSchema, fetchPostsByMediaId } from "./operations/post/fetch-by-media-id";
import { UpdatePostRequestBodySchema, UpdatePostRequestParamsSchema, UpdatePostResponseSchema, updatePost } from "./operations/post/update";

export const postsRoutes = new Elysia({ prefix: "/api/posts" })
  .get("/all", async ({ query }) => {
    const filters = query.filters ? JSON.parse(query.filters as string) : undefined;
    return fetchAllPosts(filters);
  }, {
    query: FetchAllPostsRequestQuerySchema,
  })
  .get("/by-id/:id", async ({ params: { id }, set }) => {
    const post = await fetchPostById(id);
    if (!post) {
      set.status = 404;
      return { error: "Post not found" };
    }
    return post;
  }, {
    params: FetchPostByIdRequestParamsSchema,
    response: {
      200: FetchPostByIdResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .get("/by-channel-id/:channelId", async ({ params: { channelId } }) =>
    fetchPostsByChannel(channelId)
  , {
    response: FetchPostsByChannelResponseSchema,
  })
  .get("/by-media-id/:mediaId", async ({ params: { mediaId } }) =>
    fetchPostsByMediaId(mediaId)
  , {
    params: FetchPostsByMediaIdRequestParamsSchema,
    response: FetchPostsByMediaIdResponseSchema,
  })
  .post("/", async ({ body }) => {
    const { mediaIds, ...postData } = body;
    return createPost(postData as Omit<typeof body, 'mediaIds'>, mediaIds ?? []);
  }, {
    body: CreatePostRequestBodySchema,
    response: CreatePostResponseSchema,
  })
  .patch("/by-id/:id", async ({ params: { id }, body, set }) => {
    const post = await updatePost(id, body);
    if (!post) {
      set.status = 404;
      return { error: "Post not found" };
    }
    return post;
  }, {
    params: UpdatePostRequestParamsSchema,
    body: UpdatePostRequestBodySchema,
    response: {
      200: UpdatePostResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .delete("/by-id/:id", async ({ params: { id }, set }) => {
    const success = await deletePost(id);
    if (!success) {
      set.status = 404;
      return { error: "Post not found" };
    }
    return { success: true };
  }, {
    params: DeletePostRequestParamsSchema,
    response: {
      200: DeletePostResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/by-id/:id/media", async ({ params: { id }, body, set }) => {
    const post = await addMediaToPost(id, body.mediaIds);
    if (!post) {
      set.status = 404;
      return { error: "Post not found" };
    }
    return post;
  }, {
    params: AddMediaToPostRequestParamsSchema,
    body: AddMediaToPostRequestBodySchema,
    response: {
      200: AddMediaToPostResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .delete("/by-id/:id/media", async ({ params: { id }, body, set }) => {
    const post = await removeMediaFromPost(id, body.mediaIds);
    if (!post) {
      set.status = 404;
      return { error: "Post not found" };
    }
    return post;
  }, {
    params: RemoveMediaFromPostRequestParamsSchema,
    body: RemoveMediaFromPostRequestBodySchema,
    response: {
      200: RemoveMediaFromPostResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .patch("/by-id/:id/media/:postMediaId", async ({ params: { id, postMediaId }, body, set }) => {
    const postMedia = await updatePostMedia(id, postMediaId, body);
    if (!postMedia) {
      set.status = 404;
      return { error: "PostMedia not found" };
    }
    return postMedia;
  }, {
    params: UpdatePostMediaRequestParamsSchema,
    body: UpdatePostMediaRequestBodySchema,
    response: {
      200: UpdatePostMediaResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  });

