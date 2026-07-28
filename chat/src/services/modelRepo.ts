import { db } from "@/db/client";
import { availableModels, getModelPath } from "@/services/modelFileService";
import { notifyModelStore } from "@/services/modelEvents";
import * as FileSystem from "expo-file-system/legacy";

export type DownloadedModel = {
  id: string;
  name: string;
  filename: string;
  path: string;
  size: string;
  ramRequiredBytes: number;
  ramLabel: string;
  downloaded: number;
  selected: number;
  createdAt: number;
};

export async function saveModelMetadata(model: any) {
  await db.runAsync(
    `
        INSERT OR REPLACE INTO models
        (
            id,
            name,
            filename,
            path,
            size,
            ramRequiredBytes,
            ramLabel,
            downloaded,
            createdAt
        )
        VALUES
        (?,?,?,?,?,?,?,?,?)
        `,
    [
      model.id,
      model.name,
      model.filename,
      model.path,
      model.size,
      model.ramRequired,
      1,
      Date.now(),
    ],
  );
  notifyModelStore();
}

export async function getDownloadedModels() {
  const models = (await db.getAllAsync(
    `
        SELECT *
        FROM models
        WHERE downloaded = 1
        ORDER BY createdAt ASC
        `,
  )) as DownloadedModel[];

  const verifiedModels: DownloadedModel[] = [];

  for (const model of models) {
    const info = await FileSystem.getInfoAsync(model.path);

    if (info.exists) {
      verifiedModels.push(model);
    } else {
      await deleteModelMetadata(model.id, { notify: false });
    }
  }

  return verifiedModels;
}

export async function getModelById(id: string) {
  return await db.getFirstAsync(
    `
        SELECT *
        FROM models
        WHERE id = ?
        `,
    [id],
  );
}

export async function deleteModelMetadata(
  id: string,
  options: { notify?: boolean } = {},
) {
  await db.runAsync(
    `
        DELETE FROM models
        WHERE id=?
        `,
    [id],
  );

  if (options.notify !== false) {
    notifyModelStore();
  }
}

export async function deleteDownloadedModel(id: string) {
  const model = (await getModelById(id)) as DownloadedModel | null;
  const fallback = availableModels.find((item) => item.id === id);
  const path =
    model?.path ?? (fallback ? getModelPath(fallback.filename) : null);

  if (path) {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }

  await deleteModelMetadata(id);
}

export async function deleteAllDownloadedModels() {
  const modelsDirectory = `${FileSystem.documentDirectory}models/`;

  await FileSystem.deleteAsync(modelsDirectory, { idempotent: true });

  await db.runAsync(`DELETE FROM models`);
  notifyModelStore();
}

export async function isModelDownloaded(id: string) {
  const model = (await getModelById(id)) as DownloadedModel | null;

  if (!model?.downloaded) {
    return false;
  }

  const info = await FileSystem.getInfoAsync(model.path);

  if (!info.exists) {
    await deleteModelMetadata(id, { notify: false });
    return false;
  }

  return true;
}
