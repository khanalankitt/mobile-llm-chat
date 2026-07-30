import { LlamaContext, initLlama } from "llama.rn";

let context: LlamaContext | null = null;

let operationQueue: Promise<void> = Promise.resolve();

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const result = operationQueue.then(operation);

  operationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function releaseCurrentContext() {
  if (context) {
    console.log("Releasing previous model");
    await context.release();
    context = null;
  }
}

export function loadModel(modelPath: string) {
  return enqueue(async () => {
    await releaseCurrentContext();

    console.log("Loading model:", modelPath);

    try {
      context = await initLlama({
        model: modelPath,
        n_ctx: 2048,
        n_threads: 4,
        n_gpu_layers: 0,
      });

      console.log("Model loaded");
      return true;
    } catch (error) {
      console.log("Model loading error", error);
      context = null;
      throw error;
    }
  });
}

export function unloadModel() {
  return enqueue(async () => {
    await releaseCurrentContext();
  });
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function generateResponseStream(
  messages: ChatMessage[],
  onToken: (text: string) => void,
) {
  return enqueue(async () => {
    if (!context) {
      throw new Error("Model not loaded");
    }

    const result = await context.completion(
      {
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant.",
          },
          ...messages,
        ],
        n_predict: 512,
        temperature: 0.7,
      },
      (data) => {
        const token = typeof data.token === "string" ? data.token : "";
        if (token) {
          onToken(token);
        }
      },
    );

    return result.text;
  });
}
