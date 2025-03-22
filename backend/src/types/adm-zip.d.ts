export interface IZipEntry {
  entryName: string;
  name?: string;
  isDirectory: boolean;
  getData(): Buffer;
}

declare module 'adm-zip' {
  export default class AdmZip {
    constructor(filePath?: string | Buffer);
    getEntries(): IZipEntry[];
    extractAllTo(targetPath: string, overwrite: boolean): void;
  }
}