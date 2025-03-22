export interface IZipEntry {
  entryName: string;
  name?: string;
  isDirectory: boolean;
  getData(): Buffer;
}

export interface IAdmZip {
  getEntries(): IZipEntry[];
  extractAllTo(targetPath: string, overwrite: boolean): void;
}