type DropFilesHeader = {
  pFiles: number;
  x: number;
  y: number;
  isNonClientArea: boolean;
  isWide: boolean;
};

const createDropFilesHeaderBuffer = (header: DropFilesHeader): Buffer => {
  const buffer = Buffer.alloc(20);

  buffer.writeUInt32LE(header.pFiles, 0);
  buffer.writeInt32LE(header.x, 4);
  buffer.writeInt32LE(header.y, 8);
  buffer.writeUInt32LE(header.isNonClientArea ? 1 : 0, 12);
  buffer.writeUInt32LE(header.isWide ? 1 : 0, 16);

  return buffer;
};

const createDoubleNullTerminatedWideStringList = (values: string[]): Buffer => {
  const list = `${values.join('\0')}\0\0`;
  return Buffer.from(list, 'utf16le');
};

export const createWindowsHdropBuffer = (filePaths: string[]): Buffer => {
  const header = createDropFilesHeaderBuffer({
    pFiles: 20,
    x: 0,
    y: 0,
    isNonClientArea: false,
    isWide: true,
  });
  const files = createDoubleNullTerminatedWideStringList(filePaths);
  return Buffer.concat([header, files]);
};
