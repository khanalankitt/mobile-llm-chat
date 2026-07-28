import { LlamaContext, initLlama } from "llama.rn";

let context: LlamaContext | null = null;

export async function loadModel(modelPath: string) {
  try {
    if (context) {
      await context.release();

      context = null;
    }

    console.log("Loading model:", modelPath);

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

    throw error;
  }
}

export async function generateResponseStream(
  message: string,
  onToken: (text: string) => void,
) {
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

        {
          role: "user",
          content: message,
        },
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
}

export async function unloadModel() {
  if (context) {
    await context.release();

    context = null;
  }
}
