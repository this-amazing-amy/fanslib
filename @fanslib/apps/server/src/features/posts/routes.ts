import type { AddMediaToPostRequest, CreatePostRequest, FetchAllPostsRequest, RemoveMediaFromPostRequest, UpdatePostRequest } from "@fanslib/types";
import { Elysia } from "elysia";
import { addMediaToPost } from "./operations/post-media/add";
import { removeMediaFromPost } from "./operations/post-media/remove";
import { createPost } from "./operations/post/create";
import { deletePost } from "./operations/post/delete";
import { fetchAllPosts } from "./operations/post/fetch-all";
import { fetchPostsByChannel } from "./operations/post/fetch-by-channel";
import { getPostById } from "./operations/post/fetch-by-id";
import { updatePost } from "./operations/post/update";

export const postsRoutes = new Elysia({ prefix: "/api/posts" })
  .get("/", async ({ query }) => {
    const request: FetchAllPostsRequest = {
      filters: query.filters ? JSON.parse(query.filters as string) : undefined,
    };
    return fetchAllPosts(request.filters);
  })
  .get("/:id", async ({ params: { id } }) => {
    const post = await getPostById(id);
    if (!post) {
      return { error: "Post not found" };
    }
    return post;
  })
  .get("/by-channel/:channelId", async ({ params: { channelId } }) =>
    fetchPostsByChannel(channelId)
  )
  .post("/", async ({ body }) => {
    const request = body as CreatePostRequest;
    const { mediaIds, ...postData } = request;
    return createPost({ ...postData } as Omit<CreatePostRequest, "mediaIds">, mediaIds ?? []);
  })
  .patch("/:id", async ({ params: { id }, body }) => {
    const request = body as UpdatePostRequest;
    const post = await updatePost(id, request);
    if (!post) {
      return { error: "Post not found" };
    }
    return post;
  })
  .delete("/:id", async ({ params: { id } }) => {
    await deletePost(id);
    return { success: true };
  })
  .post("/:id/media", async ({ params: { id }, body }) => {
    const request = body as AddMediaToPostRequest;
    const post = await addMediaToPost(id, request.mediaIds);
    if (!post) {
      return { error: "Post not found" };
    }
    return post;
  })
  .delete("/:id/media", async ({ params: { id }, body }) => {
    const request = body as RemoveMediaFromPostRequest;
    const post = await removeMediaFromPost(id, request.mediaIds);
    if (!post) {
      return { error: "Post not found" };
    }
    return post;
  });

