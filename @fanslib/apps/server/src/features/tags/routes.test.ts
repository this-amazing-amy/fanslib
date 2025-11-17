import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import "reflect-metadata";
import { getTestDataSource, resetAllFixtures, setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { mapResponse } from "../../lib/serialization";
import { logError, parseResponse } from "../../test-utils/setup";
import { MediaTag, TagDefinition, TagDimension } from "./entity";
import { TAG_DIMENSION_FIXTURES } from "./fixtures";
import { tagsRoutes } from "./routes";

describe("Tags Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Elysia;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    app = new Elysia()
      .onError(logError())
      .mapResponse(mapResponse)
      .use(tagsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("Tag Dimensions", () => {
    describe("GET /api/tags/dimensions", () => {
      test("returns all dimensions", async () => {
        const response = await app.handle(new Request("http://localhost/api/tags/dimensions"));
        expect(response.status).toBe(200);

        const data = await parseResponse<TagDimension[]>(response);
        expect(Array.isArray(data)).toBe(true);
        expect(data?.length).toBeGreaterThanOrEqual(TAG_DIMENSION_FIXTURES.length);

        TAG_DIMENSION_FIXTURES.forEach((fixture) => {
          const dimension = data?.find((d: TagDimension) => d.name === fixture.name);
          expect(dimension).toBeDefined();
          expect(dimension?.name).toBe(fixture.name);
        });
      });
    });

    describe("GET /api/tags/dimensions/by-id/:id", () => {
      test("returns dimension by id", async () => {
        const fixtureDimension = fixtures.tags.tagDimensions[0];
        if (!fixtureDimension) {
          throw new Error("No tag dimension fixtures available");
        }

        const response = await app.handle(
          new Request(`http://localhost/api/tags/dimensions/by-id/${fixtureDimension.id}`)
        );
        expect(response.status).toBe(200);

        const data = await parseResponse<TagDimension>(response);
        expect(data?.id).toBe(fixtureDimension.id);
        expect(data?.name).toBe(fixtureDimension.name);
      });
    });

    describe("POST /api/tags/dimensions", () => {
      test("creates a new dimension", async () => {
      const dimensionData = {
        name: "New Dimension",
        dataType: "categorical",
        sortOrder: 0,
      };

        const response = await app.handle(
          new Request("http://localhost/api/tags/dimensions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dimensionData),
          })
        );
        expect(response.status).toBe(200);

        const data = await parseResponse<TagDimension>(response);
        expect(data?.name).toBe("New Dimension");
        expect(data?.dataType).toBe("categorical");
      });
    });

    describe("PATCH /api/tags/dimensions/by-id/:id", () => {
      test("updates dimension", async () => {
        const fixtureDimension = fixtures.tags.tagDimensions[0];
        if (!fixtureDimension) {
          throw new Error("No tag dimension fixtures available");
        }

        const updateData = {
          name: "Updated Dimension",
        };

        const response = await app.handle(
          new Request(`http://localhost/api/tags/dimensions/by-id/${fixtureDimension.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          })
        );
        expect(response.status).toBe(200);

        const data = await parseResponse<TagDimension>(response);
        expect(data?.name).toBe("Updated Dimension");
        expect(data?.id).toBe(fixtureDimension.id);
      });
    });

    describe("DELETE /api/tags/dimensions/by-id/:id", () => {
      test("deletes dimension", async () => {
        const fixtureDimension = fixtures.tags.tagDimensions[fixtures.tags.tagDimensions.length - 1];
        if (!fixtureDimension) {
          throw new Error("No tag dimension fixtures available");
        }

        const response = await app.handle(
          new Request(`http://localhost/api/tags/dimensions/by-id/${fixtureDimension.id}`, {
            method: "DELETE",
          })
        );
        expect(response.status).toBe(200);

        const data = await parseResponse<{ success: boolean }>(response);
        expect(data?.success).toBe(true);

        const dataSource = getTestDataSource();
        const repository = dataSource.getRepository(TagDimension);
        const deletedDimension = await repository.findOne({ where: { id: fixtureDimension.id } });
        expect(deletedDimension).toBeNull();
      });

      test("returns 404 when tag dimension not found", async () => {
        const response = await app.handle(
          new Request("http://localhost/api/tags/dimensions/by-id/99999", {
            method: "DELETE",
          })
        );
        expect(response.status).toBe(404);

        const data = await parseResponse<{ error: string }>(response);
        expect(data?.error).toBe("Tag dimension not found");
      });
    });
  });

  describe("Tag Definitions", () => {
    describe("GET /api/tags/definitions", () => {
      test("returns empty array when no dimension specified", async () => {
        const response = await app.handle(new Request("http://localhost/api/tags/definitions"));
        expect(response.status).toBe(200);

        const data = await parseResponse<TagDefinition[]>(response);
        expect(data).toEqual([]);
      });

      test("returns definitions by dimension", async () => {
        const fixtureDimension = fixtures.tags.tagDimensions[0];
        if (!fixtureDimension) {
          throw new Error("No tag dimension fixtures available");
        }

      const response = await app.handle(
        new Request(`http://localhost/api/tags/definitions?dimensionId=${fixtureDimension.id}`)
      );
      const data = await parseResponse<TagDefinition[]>(response);

      expect(Array.isArray(data)).toBe(true);
      data?.forEach((def: TagDefinition) => {
        expect(def.dimensionId).toBe(fixtureDimension.id);
      });
      });
    });

    describe("GET /api/tags/definitions/by-id/:id", () => {
      test("returns definition by id", async () => {
        const fixtureDefinition = fixtures.tags.tagDefinitions[0];
        if (!fixtureDefinition) {
          throw new Error("No tag definition fixtures available");
        }

        const response = await app.handle(
          new Request(`http://localhost/api/tags/definitions/by-id/${fixtureDefinition.id}`)
        );
        expect(response.status).toBe(200);

        const data = await parseResponse<TagDefinition>(response);
        expect(data?.id).toBe(fixtureDefinition.id);
        expect(data?.displayName).toBe(fixtureDefinition.displayName);
      });
    });

    describe("GET /api/tags/definitions/by-ids", () => {
      test("returns multiple definitions by ids", async () => {
        const def1 = fixtures.tags.tagDefinitions[0];
        const def2 = fixtures.tags.tagDefinitions[1];
        if (!def1 || !def2) {
          throw new Error("No tag definition fixtures available");
        }

        const ids = JSON.stringify([def1.id, def2.id]);
        const response = await app.handle(
          new Request(`http://localhost/api/tags/definitions/by-ids?ids=${encodeURIComponent(ids)}`)
        );
        const data = await parseResponse<TagDefinition[]>(response);

        expect(data).toHaveLength(2);
      });
    });

    describe("POST /api/tags/definitions", () => {
      test("creates a new definition", async () => {
        const fixtureDimension = fixtures.tags.tagDimensions[0];
        if (!fixtureDimension) {
          throw new Error("No tag dimension fixtures available");
        }

      const definitionData = {
        value: "new-tag",
        displayName: "New Tag",
        dimensionId: fixtureDimension.id,
        color: "#FF0000",
      };

      const response = await app.handle(
        new Request("http://localhost/api/tags/definitions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(definitionData),
        })
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<TagDefinition>(response);
      expect(data?.displayName).toBe("New Tag");
      expect(data?.color).toBe("#FF0000");
      });
    });

    describe("PATCH /api/tags/definitions/by-id/:id", () => {
      test("updates definition", async () => {
        const fixtureDefinition = fixtures.tags.tagDefinitions[0];
        if (!fixtureDefinition) {
          throw new Error("No tag definition fixtures available");
        }

        const updateData = {
          displayName: "Updated Tag",
          color: "#00FF00",
        };

        const response = await app.handle(
          new Request(`http://localhost/api/tags/definitions/by-id/${fixtureDefinition.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          })
        );
        expect(response.status).toBe(200);

        const data = await parseResponse<TagDefinition>(response);
        expect(data?.displayName).toBe("Updated Tag");
        expect(data?.color).toBe("#00FF00");
        expect(data?.id).toBe(fixtureDefinition.id);
      });
    });

    describe("DELETE /api/tags/definitions/by-id/:id", () => {
      test("deletes definition", async () => {
        const fixtureDefinition = fixtures.tags.tagDefinitions[fixtures.tags.tagDefinitions.length - 1];
        if (!fixtureDefinition) {
          throw new Error("No tag definition fixtures available");
        }

        const response = await app.handle(
          new Request(`http://localhost/api/tags/definitions/by-id/${fixtureDefinition.id}`, {
            method: "DELETE",
          })
        );
        expect(response.status).toBe(200);

        const data = await parseResponse<{ success: boolean }>(response);
        expect(data?.success).toBe(true);

        const dataSource = getTestDataSource();
        const repository = dataSource.getRepository(TagDefinition);
        const deletedDefinition = await repository.findOne({ where: { id: fixtureDefinition.id } });
        expect(deletedDefinition).toBeNull();
      });

      test("returns 404 when tag definition not found", async () => {
        const response = await app.handle(
          new Request("http://localhost/api/tags/definitions/by-id/99999", {
            method: "DELETE",
          })
        );
        expect(response.status).toBe(404);

        const data = await parseResponse<{ error: string }>(response);
        expect(data?.error).toBe("Tag definition not found");
      });
    });
  });

  describe("Media Tagging", () => {
    describe("GET /api/tags/media/by-media-id/:mediaId", () => {
      test("returns tags for media", async () => {
        const fixtureMedia = fixtures.media[0];
        if (!fixtureMedia) {
          throw new Error("No media fixtures available");
        }

        const response = await app.handle(
          new Request(`http://localhost/api/tags/media/by-media-id/${fixtureMedia.id}`)
        );
        expect(response.status).toBe(200);

        const data = await parseResponse<MediaTag[]>(response);
        expect(Array.isArray(data)).toBe(true);
      });
    });

    describe("POST /api/tags/media/assign", () => {
      test("assigns tags to media", async () => {
        const fixtureMedia = fixtures.media[0];
        const fixtureTag = fixtures.tags.tagDefinitions[0];
        if (!fixtureMedia || !fixtureTag) {
          throw new Error("No media or tag definition fixtures available");
        }

        const assignData = {
          mediaId: fixtureMedia.id,
          tagDefinitionIds: [fixtureTag.id],
          source: "manual" as const,
        };

        const response = await app.handle(
          new Request("http://localhost/api/tags/media/assign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(assignData),
          })
        );
        expect(response.status).toBe(200);

        const data = await parseResponse<MediaTag[]>(response);
        expect(Array.isArray(data)).toBe(true);
      });
    });

    describe("POST /api/tags/media/assign-bulk", () => {
      test("assigns tags to multiple media items", async () => {
        const media1 = fixtures.media[0];
        const media2 = fixtures.media[1];
        const fixtureTag = fixtures.tags.tagDefinitions[0];
        if (!media1 || !media2 || !fixtureTag) {
          throw new Error("No media or tag definition fixtures available");
        }

        const bulkData = [
          { mediaId: media1.id, tagDefinitionIds: [fixtureTag.id], source: "manual" as const },
          { mediaId: media2.id, tagDefinitionIds: [fixtureTag.id], source: "manual" as const },
        ];

        const response = await app.handle(
          new Request("http://localhost/api/tags/media/assign-bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bulkData),
          })
        );
        expect(response.status).toBe(200);

        const data = await parseResponse<MediaTag[]>(response);
        expect(Array.isArray(data)).toBe(true);
      });
    });

    describe("DELETE /api/tags/media/by-media-id/:mediaId", () => {
      test("removes tags from media", async () => {
        const fixtureMedia = fixtures.media[0];
        const fixtureTag = fixtures.tags.tagDefinitions[0];
        if (!fixtureMedia || !fixtureTag) {
          throw new Error("No media or tag definition fixtures available");
        }

        const response = await app.handle(
          new Request(`http://localhost/api/tags/media/by-media-id/${fixtureMedia.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tagIds: [fixtureTag.id] }),
          })
        );
        expect(response.status).toBe(200);

        const data = await parseResponse<{ success: boolean }>(response);
        expect(data?.success).toBe(true);
      });
    });
  });

  describe("Drift Prevention", () => {
    describe("GET /api/tags/drift-prevention/stats", () => {
      test("returns drift prevention stats", async () => {
        const response = await app.handle(
          new Request("http://localhost/api/tags/drift-prevention/stats")
        );
        expect(response.status).toBe(200);

        const data = await parseResponse<Record<string, unknown>>(response);
        expect(data).toHaveProperty("totalMediaTags");
      });
    });

    describe("POST /api/tags/drift-prevention/cleanup", () => {
      test("performs cleanup", async () => {
        const response = await app.handle(
          new Request("http://localhost/api/tags/drift-prevention/cleanup", {
            method: "POST",
          })
        );
        expect(response.status).toBe(200);

        const data = await parseResponse<Record<string, unknown>>(response);
        expect(data).toHaveProperty("orphanedMediaTagsRemoved");
        expect(data).toHaveProperty("stickerDisplayPropertiesSynced");
        expect(data).toHaveProperty("timestamp");
      });
    });

    describe("POST /api/tags/drift-prevention/sync-sticker-display", () => {
      test("syncs sticker display properties", async () => {
        const response = await app.handle(
          new Request("http://localhost/api/tags/drift-prevention/sync-sticker-display", {
            method: "POST",
          })
        );
        expect(response.status).toBe(200);

        const data = await parseResponse<Record<string, unknown>>(response);
        expect(data).toHaveProperty("updatedCount");
        expect(data).toHaveProperty("updatedIds");
      });
    });
  });
});

