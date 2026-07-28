import AsyncStorage from "@react-native-async-storage/async-storage";

export type StoredModel = {
  id: string;
  name: string;
  provider?: string;
  endpoint?: string;
};

export type ChatMessage = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
};

export type ChatSession = {
  id: string;
  modelId?: string;
  title?: string;
  messages: ChatMessage[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

const MODELS_KEY = "mobile-llm-chat.models";
const HISTORY_KEY = "mobile-llm-chat.chat-history";
const SELECTED_MODEL_ID_KEY = "mobile-llm-chat.selected-model-id";

type ModelStoreListener = () => void;
const listeners = new Set<ModelStoreListener>();

function notifyModelStore() {
  listeners.forEach((listener) => listener());
}

function normalizeStoredModels(value: unknown): StoredModel[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is StoredModel =>
        !!item &&
        typeof item === "object" &&
        typeof (item as any).id === "string" &&
        typeof (item as any).name === "string",
    );
  }

  if (value && typeof value === "object") {
    const maybe = value as Record<string, unknown>;

    if (Array.isArray(maybe.models)) {
      return normalizeStoredModels(maybe.models);
    }

    if (typeof maybe.id === "string" && typeof maybe.name === "string") {
      return [
        {
          id: maybe.id,
          name: maybe.name,
          provider:
            typeof maybe.provider === "string" ? maybe.provider : undefined,
          endpoint:
            typeof maybe.endpoint === "string" ? maybe.endpoint : undefined,
        },
      ];
    }
  }

  if (typeof value === "string") {
    try {
      return normalizeStoredModels(JSON.parse(value));
    } catch {
      return [];
    }
  }

  return [];
}

export function subscribeToModelStore(listener: ModelStoreListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getStoredModels(): Promise<StoredModel[]> {
  const raw = await AsyncStorage.getItem(MODELS_KEY);
  if (!raw) return [];

  try {
    return normalizeStoredModels(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function saveStoredModels(models: StoredModel[]): Promise<void> {
  await AsyncStorage.setItem(MODELS_KEY, JSON.stringify(models));
  notifyModelStore();
}

export async function deleteStoredModel(
  modelId: string,
): Promise<StoredModel[]> {
  const nextModels = (await getStoredModels()).filter(
    (model) => model.id !== modelId,
  );
  await saveStoredModels(nextModels);

  const selectedModelId = await getSelectedModelId();
  if (selectedModelId === modelId) {
    await clearSelectedModelId();
  }

  const history = await getStoredChatHistory();
  const nextHistory = history.filter((session) => session.modelId !== modelId);
  await saveStoredChatHistory(nextHistory);

  return nextModels;
}

export async function deleteAllStoredModels(): Promise<void> {
  await AsyncStorage.removeItem(MODELS_KEY);
  await clearSelectedModelId();
  notifyModelStore();
}

export async function getStoredChatHistory(): Promise<ChatSession[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];

  try {
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveStoredChatHistory(
  history: ChatSession[],
): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export async function clearAllStoredHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

export async function getSelectedModelId(): Promise<string | null> {
  const value = await AsyncStorage.getItem(SELECTED_MODEL_ID_KEY);
  return value ?? null;
}

export async function setSelectedModelId(
  modelId: string | null,
): Promise<void> {
  if (!modelId) {
    await AsyncStorage.removeItem(SELECTED_MODEL_ID_KEY);
  } else {
    await AsyncStorage.setItem(SELECTED_MODEL_ID_KEY, modelId);
  }
  notifyModelStore();
}

export async function clearSelectedModelId(): Promise<void> {
  await AsyncStorage.removeItem(SELECTED_MODEL_ID_KEY);
  notifyModelStore();
}
