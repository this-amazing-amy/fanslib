import { getTestDataSource } from "../../lib/test-db";
import { FilterPreset as FilterPresetEntity } from "./entity";
import { FILTER_PRESET_FIXTURES } from "./fixtures-data";

export { FILTER_PRESET_FIXTURES } from "./fixtures-data";

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

