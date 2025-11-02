import fs from "fs/promises";
import path from "path";

const isUppercaseExtension = (filePath: string) => {
  const extension = path.extname(filePath);
  const hasUppercaseLetters = /[A-Z]/.test(extension);
  return hasUppercaseLetters;
};

export const repairUppercaseExtension = async (filePath: string) => {
  if (!isUppercaseExtension(filePath)) return filePath;

  const lowercasedFilePath = filePath.toLowerCase();
  await fs.rename(filePath, lowercasedFilePath);
  return lowercasedFilePath;
};
