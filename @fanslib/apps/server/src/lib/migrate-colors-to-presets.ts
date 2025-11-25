import { IsNull, Not } from "typeorm";
import { db } from "./db";
import { TagDefinition } from "../features/tags/entity";
import { ContentSchedule } from "../features/content-schedules/entity";

const USER_COLOR_PRESETS = [
  { id: "pink", hex: "#F5A8D0" },
  { id: "peach", hex: "#FBBF7F" },
  { id: "yellow", hex: "#FDE68A" },
  { id: "lime", hex: "#D9F99D" },
  { id: "aqua", hex: "#A5F3FC" },
  { id: "periwinkle", hex: "#C7D2FE" },
  { id: "lilac", hex: "#E9D5FF" },
  { id: "rose", hex: "#FECDD3" },
];

const findClosestPreset = (hexColor: string): string => {
  // Simple approach: just use hash of color to pick deterministic preset
  const colorValue = parseInt(hexColor.replace("#", ""), 16);
  const index = colorValue % USER_COLOR_PRESETS.length;
  return `preset:${USER_COLOR_PRESETS[index].id}`;
};

export const migrateColorsToPresets = async () => {
  const dataSource = await db();

  // Migrate tag definitions
  const tagRepo = dataSource.getRepository(TagDefinition);
  const tags = await tagRepo.find({ where: { color: Not(IsNull()) } });

  const tagsToUpdate = tags.filter((tag) => tag.color && tag.color.startsWith("#"));

  for (const tag of tagsToUpdate) {
    if (tag.color) {
      tag.color = findClosestPreset(tag.color);
    }
  }

  if (tagsToUpdate.length > 0) {
    await tagRepo.save(tagsToUpdate);
  }

  // Migrate content schedules
  const scheduleRepo = dataSource.getRepository(ContentSchedule);
  const schedules = await scheduleRepo.find({ where: { color: Not(IsNull()) } });

  const schedulesToUpdate = schedules.filter((schedule) => schedule.color && schedule.color.startsWith("#"));

  for (const schedule of schedulesToUpdate) {
    if (schedule.color) {
      schedule.color = findClosestPreset(schedule.color);
    }
  }

  if (schedulesToUpdate.length > 0) {
    await scheduleRepo.save(schedulesToUpdate);
  }

  console.log(`Migrated ${tagsToUpdate.length} tags and ${schedulesToUpdate.length} schedules`);

  return {
    tagsUpdated: tagsToUpdate.length,
    schedulesUpdated: schedulesToUpdate.length,
  };
};
