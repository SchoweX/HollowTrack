export interface ExportFile {
  filename: string;
  mimeType: string;
  content: string;
}

export interface FilePlatform {
  saveFile(file: ExportFile): void;
}

export const browserFilePlatform: FilePlatform = {
  saveFile(file) {
    const blob = new Blob([file.content], { type: file.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = file.filename;
    link.click();

    URL.revokeObjectURL(url);
  },
};

export interface ImportFile {
  text(): Promise<string>;
}

export async function readFileText(file: ImportFile): Promise<string> {
  return file.text();
}
