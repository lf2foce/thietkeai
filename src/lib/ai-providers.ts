import { GoogleGenAI, PersonGeneration } from '@google/genai';

export interface GenerationResult {
  status: "succeeded" | "failed" | "processing";
  restoredImage?: string;
  error?: string;
}

export interface AIProvider {
  generate(imageUrl: string, prompt: string, room?: string): Promise<{ id: string }>;
  getStatus(id: string): Promise<GenerationResult>;
}

export class ReplicateProvider implements AIProvider {
  async generate(imageUrl: string, prompt: string, room?: string): Promise<{ id: string }> {
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
          prompt: `${room ? room + " " : ""}${prompt}`,
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

  async generate(imageUrl: string, prompt: string, room?: string): Promise<{ id: string }> {
    // For Google, we'll perform the generation in the status check or here.
    // To maintain the polling structure, we return a "job ID" that encodes the parameters.
    // Or we just trigger it now and cache the result.
    const id = `google_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Trigger generation asynchronously (background task simulated via the fact that the first getStatus will trigger it)
    googleResultsCache.set(id, JSON.stringify({ imageUrl, prompt, room, status: "pending" }));
    
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

    // If pending, perform the generation now
    try {
      // Fetch the original image to use as a reference (Image-to-Image / Remodel)
      let imagePart;
      try {
        const imageRes = await fetch(data.imageUrl);
        const imageBuffer = await imageRes.arrayBuffer();
        imagePart = {
          inlineData: {
            data: Buffer.from(imageBuffer).toString('base64'),
            mimeType: 'image/jpeg'
          }
        };
      } catch (err) {
        console.warn("Failed to fetch original image for reference, proceeding with text only:", err);
      }

      // Using generateContent for Gemini multimodal models
      const response = await this.ai.models.generateContent({
        model: 'models/gemini-2.5-flash-image',
        contents: [
          {
            role: 'user',
            parts: [
              ...(imagePart ? [imagePart] : []),
              { text: `Remodel this room based on the following theme: ${data.prompt}. Maintain the structural layout of the room but update the furniture, colors, and lighting. Output the result as an image.` }
            ]
          }
        ],
        config: {
          responseModalities: ["IMAGE"],
          // responseMimeType: "image/jpeg", // Optional, depending on model support
        },
      });

      // Extract the generated image from response parts
      const generatedPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      const generatedImage = generatedPart?.inlineData?.data;

      if (!generatedImage) {
        console.error("Gemini Response:", JSON.stringify(response, null, 2));
        throw new Error("No images generated in Gemini response");
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
