export const getLibraryPath = () => process.env.LIBRARY_PATH ?? "./library";

export const resolveMediaPath = (relativePath: string) => {
  const libraryPath = getLibraryPath();
  return `${libraryPath}/${relativePath}`;
};

export const convertRelativeToAbsolute = (relativePath: string) => resolveMediaPath(relativePath);

