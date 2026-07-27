import { LocalModel } from "@/types";
import * as FileSystem from "expo-file-system/legacy";

export function getModelPath(filename: string) {
  return `${FileSystem.documentDirectory}models/${filename}`;
}

export const availableModels: LocalModel[] = [
  {
    id: "qwen2.5-0.5b",
    name: "Qwen 2.5 0.5B Instruct",
    description:
      "Lightweight model recommended for low-end phones. Good for basic chat and simple tasks.",
    tier: "low",
    size: "491 MB",
    ramRequired: "< 4GB RAM",
    filename: "qwen2.5-0.5b-instruct-q4_k_m.gguf",
    url: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf",
    downloaded: false,
  },

  {
    id: "qwen2.5-1.5b",
    name: "Qwen 2.5 1.5B Instruct",
    description:
      "Balanced model for most modern phones with better reasoning and responses.",
    tier: "medium",
    size: "1 GB",
    ramRequired: "4-6GB RAM",
    filename: "qwen2.5-1.5b-instruct-q4_k_m.gguf",
    url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    downloaded: false,
  },

  {
    id: "qwen2.5-3b",
    name: "Qwen 2.5 3B Instruct",
    description: "Higher quality model for powerful phones with more RAM.",
    tier: "high",
    size: "2.1 GB",
    ramRequired: "6GB+ RAM",
    filename: "qwen2.5-3b-instruct-q4_k_m.gguf",
    url: "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf",
    downloaded: false,
  },
];
