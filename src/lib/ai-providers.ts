import { GoogleGenAI, PersonGeneration } from '@google/genai';

export interface GenerationResult {
  status: "succeeded" | "failed" | "processing";
  restoredImage?: string;
  error?: string;
}

export interface AIProvider {
  generate(imageUrl: string, prompt: string): Promise<{ id: string }>;
  getStatus(id: string): Promise<GenerationResult>;
}

export class ReplicateProvider implements AIProvider {
  async generate(imageUrl: string, prompt: string): Promise<{ id: string }> {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
      },
      body: JSON.stringify({
        version: "76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
        input: {
          image: imageUrl,
          prompt: prompt,
          guidance_scale: 15,
          negative_prompt: "lowres, watermark, banner, logo, watermark, contactinfo, text, deformed, blurry, blur, out of focus, out of frame, surreal, extra, ugly, upholstered walls, fabric walls, plush walls, mirror, mirrored, functional, realistic",
          prompt_strength: 0.8,
          num_inference_steps: 50,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Replicate generation failed");
    return { id: data.id };
  }

  async getStatus(id: string): Promise<GenerationResult> {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Replicate status check failed");

    if (data.status === "succeeded") {
      return { status: "succeeded", restoredImage: data.output };
    } else if (data.status === "failed") {
      return { status: "failed", error: data.error };
    } else {
      return { status: "processing" };
    }
  }
}

// In-memory store for Google results (Simulated for this demo/small scale)
// In a real production app, use a DB or KV store.
const googleResultsCache = new Map<string, string>();

export class GoogleGenAIProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is not defined in environment variables");
    }
    this.ai = new GoogleGenAI({
      apiKey: apiKey,
    });
  }

  async generate(imageUrl: string, prompt: string): Promise<{ id: string }> {
    // For Google, we'll perform the generation in the status check or here.
    // To maintain the polling structure, we return a "job ID" that encodes the parameters.
    // Or we just trigger it now and cache the result.
    const id = `google_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Trigger generation asynchronously (background task simulated via the fact that the first getStatus will trigger it)
    // Actually, in Next.js, we can't easily do background tasks without a worker.
    // So we'll just store the request params and have getStatus do the work if it's the first time.
    googleResultsCache.set(id, JSON.stringify({ imageUrl, prompt, status: "pending" }));
    
    return { id };
  }

  async getStatus(id: string): Promise<GenerationResult> {
    const cached = googleResultsCache.get(id);
    if (!cached) return { status: "failed", error: "Job not found" };

    const data = JSON.parse(cached);
    if (data.status === "succeeded") {
      return { status: "succeeded", restoredImage: data.image };
    }
    if (data.status === "failed") {
      return { status: "failed", error: data.error };
    }

    // If pending, perform the generation now (since it's Imagen 4 Fast, it should be quick enough for a single request)
    try {
      const response = await this.ai.models.generateImages({
        model: 'models/imagen-4.0-fast-generate-001',
        prompt: data.prompt, // In a real remodel app, we'd use the image too, but following user snippet
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          personGeneration: PersonGeneration.ALLOW_ADULT,
          aspectRatio: '1:1',
        },
      });

      const generatedImage = response?.generatedImages?.[0]?.image?.imageBytes;
      if (!generatedImage) {
        throw new Error("No images generated");
      }

      // Convert base64 to a data URL for easy display
      const imageUrl = `data:image/jpeg;base64,${generatedImage}`;
      
      googleResultsCache.set(id, JSON.stringify({ ...data, status: "succeeded", image: imageUrl }));
      return { status: "succeeded", restoredImage: imageUrl };
    } catch (error: any) {
      console.error("Google GenAI Error:", error);
      googleResultsCache.set(id, JSON.stringify({ ...data, status: "failed", error: error.message }));
      return { status: "failed", error: error.message };
    }
  }
}

export function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || "replicate";
  if (provider === "google") {
    return new GoogleGenAIProvider();
  }
  return new ReplicateProvider();
}
