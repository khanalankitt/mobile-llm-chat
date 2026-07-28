import * as FileSystem from "expo-file-system/legacy";

type ProgressCallback = (progress: number) => void;

interface DownloadTask {
  download: FileSystem.DownloadResumable;
  uri: string;
  filename: string;
  progress?: ProgressCallback;
}

const activeDownloads = new Map<string, DownloadTask>();

const getModelsDirectory = () => {
  return `${FileSystem.documentDirectory}models/`;
};

async function ensureModelsDirectory() {
  const directory = getModelsDirectory();

  const info = await FileSystem.getInfoAsync(directory);

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directory, {
      intermediates: true,
    });
  }

  return directory;
}

export async function downloadModel(
  url: string,
  filename: string,
  onProgress?: ProgressCallback,
  modelId?: string,
) {
  const id = modelId ?? filename;

  const directory = await ensureModelsDirectory();

  const fileUri = `${directory}${filename}`;

  const download = FileSystem.createDownloadResumable(
    url,

    fileUri,

    {},

    (progress) => {
      const percentage =
        progress.totalBytesWritten / progress.totalBytesExpectedToWrite;

      onProgress?.(percentage);
    },
  );

  activeDownloads.set(id, {
    download,
    uri: fileUri,
    filename,
    progress: onProgress,
  });

  const result = await download.downloadAsync().finally(() => {
    activeDownloads.delete(id);
  });

  if (result?.uri) {
    return result.uri;
  }

  return result?.uri;
}

export async function cancelDownload(modelId: string) {
  const task = activeDownloads.get(modelId);

  if (!task) {
    return;
  }

  try {
    await task.download.cancelAsync();

    await FileSystem.deleteAsync(task.uri, {
      idempotent: true,
    });
  } catch (error) {
    console.log("Cancel error:", error);
  }

  activeDownloads.delete(modelId);
}

export async function modelExists(filename: string) {
  const file = `${await getModelsDirectory()}${filename}`;

  const info = await FileSystem.getInfoAsync(file);

  return info.exists;
}

export async function getModelPath(filename: string) {
  return `${await getModelsDirectory()}${filename}`;
}
