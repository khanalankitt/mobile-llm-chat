type ModelStoreListener = () => void;

const listeners = new Set<ModelStoreListener>();

export function notifyModelStore() {
  listeners.forEach((listener) => listener());
}

export function subscribeToModelStore(listener: ModelStoreListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
