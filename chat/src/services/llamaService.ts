let currentModel: string | null = null;

export async function loadModel(path: string) {
  console.log("Loading model:", path);

  currentModel = path;
}

export async function generateResponse(prompt: string) {
  if (!currentModel) {
    throw new Error("No model loaded");
  }

  return `
Model loaded successfully.

You asked:
${prompt}

Real llama.rn inference will be connected next.
 `;
}
