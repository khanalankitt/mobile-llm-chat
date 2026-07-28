import { ModelTier } from "@/types";
import * as FileSystem from "expo-file-system/legacy";
import DeviceInfo from "react-native-device-info";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeviceSpecs {
  totalMemory: number; // bytes
  freeStorage: number; // bytes
  totalStorage: number; // bytes
}

/**
 * A model as it appears in your catalog / download list. `size` and
 * `ramRequired` are human-readable strings here (e.g. "4.2 GB", "512 MB"),
 * matching your existing model type — they get parsed to bytes internally.
 */
export interface CatalogModel {
  id: string;
  name: string;
  description: string;
  tier: ModelTier;
  size: string | number;
  ramRequiredBytes: number;
  ramLabel: string;
  filename: string;
  url: string;
  downloaded: boolean;
}

/**
 * Normalizes a size value to bytes. Accepts either a display string
 * ("4.2 GB", "512MB") — used by catalog entries — or a raw byte number,
 * already used by rows pulled from the downloaded-models table. Returns 0
 * for anything unparseable, so a malformed value fails safe instead of
 * throwing.
 */
export function parseSizeToBytes(value: string | number): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  const match = value.trim().match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
  if (!match) return 0;

  const amount = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
  };

  return amount * (multipliers[unit] ?? 0);
}

export type RamTier = "comfortable" | "runs" | "risky" | "unsupported";

export interface ModelFit {
  model: CatalogModel;
  fitsRam: boolean;
  fitsStorage: boolean;
  ramTier: RamTier;
  /** Bytes of RAM this model needs beyond what's "safe" to use. 0 if it fits comfortably. */
  ramOverage: number;
  /** Bytes still needed if there isn't enough free storage. 0 if it fits. */
  storageShortfall: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Total RAM isn't the same as *available* RAM — the OS and background apps
// already claim a chunk of it. These thresholds are fractions of TOTAL
// device RAM a model's requirement is allowed to consume before we consider
// it comfortable / runnable / risky.
const RAM_TIER_THRESHOLDS = {
  comfortable: 0.65, // model needs <= 65% of total RAM
  runs: 0.85, // model needs <= 85% of total RAM
  risky: 1.0, // model needs <= 100% of total RAM
  // anything above 0.8 => "unsupported"
};

// Leave some headroom on disk beyond the model's own size (temp files,
// partial downloads, OS overhead) rather than allowing a download that
// exactly fills the device.
const STORAGE_SAFETY_MARGIN_BYTES = 200 * 1024 * 1024; // 200 MB

// ---------------------------------------------------------------------------
// Device specs
// ---------------------------------------------------------------------------

let cachedSpecs: DeviceSpecs | null = null;

/**
 * Reads current device RAM + storage. Storage changes as models are
 * downloaded/deleted, so pass `forceRefresh: true` right before you need an
 * up-to-date number (e.g. opening the download screen). Otherwise this
 * reuses the last reading within the same app session.
 */
export async function getDeviceSpecs(
  forceRefresh = false,
): Promise<DeviceSpecs> {
  if (cachedSpecs && !forceRefresh) {
    return cachedSpecs;
  }

  const [totalMemory, freeStorage, totalStorage] = await Promise.all([
    DeviceInfo.getTotalMemory(),
    FileSystem.getFreeDiskStorageAsync(),
    FileSystem.getTotalDiskCapacityAsync(),
  ]);

  cachedSpecs = { totalMemory, freeStorage, totalStorage };
  return cachedSpecs;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(0)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

// ---------------------------------------------------------------------------
// Fit evaluation
// ---------------------------------------------------------------------------

function getRamTier(ramRequired: number, totalMemory: number): RamTier {
  if (totalMemory <= 0) return "unsupported";
  const fraction = ramRequired / totalMemory;

  if (fraction <= RAM_TIER_THRESHOLDS.comfortable) return "comfortable";
  if (fraction <= RAM_TIER_THRESHOLDS.runs) return "runs";
  if (fraction <= RAM_TIER_THRESHOLDS.risky) return "risky";
  return "unsupported";
}

/**
 * Evaluates a single model against the device's current specs — whether it
 * fits in RAM, whether there's enough free storage to download it, and by
 * how much it falls short if not.
 */
export function evaluateModel(
  model: CatalogModel,
  specs: DeviceSpecs,
): ModelFit {
  const ramRequiredBytes = model.ramRequiredBytes;
  const sizeBytes = parseSizeToBytes(model.size);

  const ramTier = getRamTier(ramRequiredBytes, specs.totalMemory);
  const fitsRam = ramTier !== "unsupported";
  const ramOverage = fitsRam
    ? 0
    : ramRequiredBytes - specs.totalMemory * RAM_TIER_THRESHOLDS.risky;

  const requiredStorage = sizeBytes + STORAGE_SAFETY_MARGIN_BYTES;
  const fitsStorage = specs.freeStorage >= requiredStorage;
  const storageShortfall = fitsStorage
    ? 0
    : requiredStorage - specs.freeStorage;

  return {
    model,
    fitsRam,
    fitsStorage,
    ramTier,
    ramOverage,
    storageShortfall,
  };
}

export function getSuggestedModels(
  catalog: CatalogModel[],
  specs: DeviceSpecs,
): ModelFit[] {
  return catalog
    .map((model) => evaluateModel(model, specs))
    .sort((a, b) => {
      // Models that fit RAM come first.
      if (a.fitsRam !== b.fitsRam) {
        return a.fitsRam ? -1 : 1;
      }

      // Models that fit storage come first.
      if (a.fitsStorage !== b.fitsStorage) {
        return a.fitsStorage ? -1 : 1;
      }

      // Among models that fit, recommend the largest one.
      return b.model.ramRequiredBytes - a.model.ramRequiredBytes;
    });
}

export function getBestModel(
  catalog: CatalogModel[],
  specs: DeviceSpecs,
): ModelFit | null {
  const suggestions = getSuggestedModels(catalog, specs);

  return suggestions.find((fit) => fit.fitsRam && fit.fitsStorage) ?? null;
}
