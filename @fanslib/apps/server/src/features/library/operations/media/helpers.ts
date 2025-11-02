export const getLibraryPath = (): string => {
  const path = process.env.LIBRARY_PATH;
  if (!path) {
    throw new Error("LIBRARY_PATH environment variable is not set");
  }
  return path;
};

