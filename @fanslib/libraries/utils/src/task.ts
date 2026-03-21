export type Task<T> = () => Promise<T>;

const splitEvery = <T>(n: number, arr: T[]): T[][] => {
  const result: T[][] = [];
  // eslint-disable-next-line functional/no-loop-statements, functional/no-let
  for (let i = 0; i < arr.length; i += n) {
    result.push(arr.slice(i, i + n));
  }
  return result;
};

// JS doesn't have tail-call optimization, so we need to write this non-recursive, or else 💥☹️
export const inParallelChunksOf =
  <T>(n: number, chunkEffectCallback?: (chunkResults: T[], chunkNumber: number) => unknown) =>
  async (tasks: Array<Task<T>>): Promise<T[]> => {
    // eslint-disable-next-line functional/no-let
    let results: T[] = [];
    if (n < 1 || tasks.length < 1) return results;
    const chunks = splitEvery(n, tasks);

    // eslint-disable-next-line functional/no-loop-statements
    for (const [i, chunk] of chunks.entries()) {
      const chunkResults = await Promise.all(chunk.map((f) => f()));

      chunkEffectCallback?.(chunkResults, i);

      results = [...results, ...chunkResults];
    }

    return results;
  };

// Like Promise.all, but with tasks
export const inParallel = <T>(tasks: Array<Task<T>>) => inParallelChunksOf<T>(tasks.length)(tasks);

// Like Promise.all, but with tasks and sequentially
export const sequentially = <T>(tasks: Array<Task<T>>) => inParallelChunksOf<T>(1)(tasks);
