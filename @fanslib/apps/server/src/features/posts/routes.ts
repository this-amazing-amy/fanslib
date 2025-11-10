import { Elysia } from "elysia";
import { AddMediaToPostRequestBodySchema, AddMediaToPostResponseSchema, addMediaToPost } from "./operations/post-media/add";
import { RemoveMediaFromPostRequestBodySchema, RemoveMediaFromPostResponseSchema, removeMediaFromPost } from "./operations/post-media/remove";
import { CreatePostRequestBodySchema, CreatePostResponseSchema, createPost } from "./operations/post/create";
import { DeletePostResponseSchema, deletePost } from "./operations/post/delete";
import { FetchAllPostsRequestQuerySchema, FetchAllPostsResponseSchema, fetchAllPosts } from "./operations/post/fetch-all";
import { FetchPostsByChannelResponseSchema, fetchPostsByChannel } from "./operations/post/fetch-by-channel";
import { GetPostByIdResponseSchema, getPostById } from "./operations/post/fetch-by-id";
import { UpdatePostRequestBodySchema, UpdatePostResponseSchema, updatePost } from "./operations/post/update";

export const postsRoutes = new Elysia({ prefix: "/api/posts" })
  .get("/", async ({ query }) => {
    const filters = query.filters ? JSON.parse(query.filters as string) : undefined;
    return fetchAllPosts(filters);
  }, {
    query: FetchAllPostsRequestQuerySchema,
    response: FetchAllPostsResponseSchema,
  })
  .get("/:id", async ({ params: { id } }) => {
    const post = await getPostById(id);
    if (!post) {
      return { error: "Post not found" };
    }
    return post;
  }, {
    response: GetPostByIdResponseSchema,
  })
  .get("/by-channel/:channelId", async ({ params: { channelId } }) =>
    fetchPostsByChannel(channelId)
  , {
    response: FetchPostsByChannelResponseSchema,
  })
  .post("/", async ({ body }) => {
    const { mediaIds, ...postData } = body;
    return createPost(postData, mediaIds ?? []);
  }, {
    body: CreatePostRequestBodySchema,
    response: CreatePostResponseSchema,
  })
  .patch("/:id", async ({ params: { id }, body }) => {
    const post = await updatePost(id, body);
    if (!post) {
      return { error: "Post not found" };
    }
    return post;
  }, {
    body: UpdatePostRequestBodySchema,
    response: UpdatePostResponseSchema,
  })
  .delete("/:id", async ({ params: { id } }) => {
    await deletePost(id);
    return { success: true };
  }, {
    response: DeletePostResponseSchema,
  })
  .post("/:id/media", async ({ params: { id }, body }) => {
    const post = await addMediaToPost(id, body.mediaIds);
    if (!post) {
      return { error: "Post not found" };
    }
    return post;
  }, {
    body: AddMediaToPostRequestBodySchema,
    response: AddMediaToPostResponseSchema,
  })
  .delete("/:id/media", async ({ params: { id }, body }) => {
    const post = await removeMediaFromPost(id, body.mediaIds);
    if (!post) {
      return { error: "Post not found" };
    }
    return post;
  }, {
    body: RemoveMediaFromPostRequestBodySchema,
    response: RemoveMediaFromPostResponseSchema,
  });

