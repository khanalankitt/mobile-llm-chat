import { db } from "@/db/client";

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
            ramRequired,
            downloaded,
            createdAt
        )
        VALUES
        (?,?,?,?,?,?,?,?)
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
}

export async function getDownloadedModels() {
  return await db.getAllAsync(
    `
        SELECT *
        FROM models
        WHERE downloaded = 1
        `,
  );
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

export async function deleteModelMetadata(id: string) {
  await db.runAsync(
    `
        DELETE FROM models
        WHERE id=?
        `,
    [id],
  );
}
