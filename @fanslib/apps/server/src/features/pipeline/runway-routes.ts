import { Hono } from "hono";
import { getRunway } from "./operations/get-runway";

export const runwayRoutes = new Hono().get("/api/runway", async (c) => {
  const result = await getRunway();
  return c.json(result);
});
