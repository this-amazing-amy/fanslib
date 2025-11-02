import type { FilterPreset } from "@fanslib/types";
import { getTestDataSource } from "../../lib/db.test";
import { FilterPreset as FilterPresetEntity } from "./entity";

export type FilterPresetFixture = Omit<FilterPreset, "createdAt" | "updatedAt">;

export const FILTER_PRESET_FIXTURES: FilterPresetFixture[] = [
  {
    id: "preset-1",
    name: "Videos Only",
    filtersJson: JSON.stringify([
      {
        include: true,
        items: [{ type: "mediaType", value: "video" }],
      },
    ]),
  },
  {
    id: "preset-2",
    name: "Images Only",
    filtersJson: JSON.stringify([
      {
        include: true,
        items: [{ type: "mediaType", value: "image" }],
      },
    ]),
  },
  {
    id: "preset-3",
    name: "Unposted Media",
    filtersJson: JSON.stringify([
      {
        include: true,
        items: [{ type: "posted", value: false }],
      },
    ]),
  },
  {
    id: "preset-4",
    name: "Posted Media",
    filtersJson: JSON.stringify([
      {
        include: true,
        items: [{ type: "posted", value: true }],
      },
    ]),
  },
  {
    id: "preset-5",
    name: "Unposted Videos",
    filtersJson: JSON.stringify([
      {
        include: true,
        items: [
          { type: "mediaType", value: "video" },
          { type: "posted", value: false },
        ],
      },
    ]),
  },
  {
    id: "preset-6",
    name: "Filename Search",
    filtersJson: JSON.stringify([
      {
        include: true,
        items: [{ type: "filename", value: "photo" }],
      },
    ]),
  },
  {
    id: "preset-7",
    name: "Recent Media",
    filtersJson: JSON.stringify([
      {
        include: true,
        items: [
          {
            type: "createdDateStart",
            value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    ]),
  },
  {
    id: "preset-8",
    name: "Date Range",
    filtersJson: JSON.stringify([
      {
        include: true,
        items: [
          {
            type: "createdDateStart",
            value: new Date("2024-01-01"),
          },
          {
            type: "createdDateEnd",
            value: new Date("2024-12-31"),
          },
        ],
      },
    ]),
  },
  {
    id: "preset-9",
    name: "Exclude Posted Videos",
    filtersJson: JSON.stringify([
      {
        include: false,
        items: [
          { type: "mediaType", value: "video" },
          { type: "posted", value: true },
        ],
      },
    ]),
  },
  {
    id: "preset-10",
    name: "Caption Search",
    filtersJson: JSON.stringify([
      {
        include: true,
        items: [{ type: "caption", value: "beach" }],
      },
    ]),
  },
];

export const seedFilterPresetFixtures = async () => {
  const dataSource = getTestDataSource();
  const presetRepo = dataSource.getRepository(FilterPresetEntity);

  await Promise.all(FILTER_PRESET_FIXTURES.map(async (fixture) => {
    const existing = await presetRepo.findOne({ where: { id: fixture.id } });
    if (!existing) {
      const preset = presetRepo.create({
        id: fixture.id,
        name: fixture.name,
        filtersJson: fixture.filtersJson,
      });
      await presetRepo.save(preset);
    }
  }))

  return presetRepo.find();
};

