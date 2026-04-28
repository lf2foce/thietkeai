import { GoogleGenAI, PersonGeneration } from '@google/genai';

export interface GenerationResult {
  status: "succeeded" | "failed" | "processing";
  restoredImage?: string;
  error?: string;
}

export interface AIProvider {
  generate(imageUrl: string, prompt: string, room?: string): Promise<{ id: string; restoredImage?: string }>;
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

export class GoogleGenAIProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is not defined in environment variables");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generate(imageUrl: string, prompt: string, room?: string): Promise<{ id: string; restoredImage?: string }> {
    const id = `google_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    let imagePart;
    try {
      const imageRes = await fetch(imageUrl);
      const imageBuffer = await imageRes.arrayBuffer();
      imagePart = {
        inlineData: {
          data: Buffer.from(imageBuffer).toString('base64'),
          mimeType: 'image/jpeg'
        }
      };
    } catch (err) {
      console.warn("Failed to fetch original image, proceeding with text only:", err);
    }

    const response = await this.ai.models.generateContent({
      // model: 'models/gemini-2.5-flash-image',
      model: 'models/gemini-3.1-flash-image-preview',
      contents: [{
        role: 'user',
        parts: [
          ...(imagePart ? [imagePart] : []),
          { text: `${prompt} Output the result as a photorealistic image.` }
        ]
      }],
      config: { responseModalities: ["IMAGE"] },
    });

    const generatedPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    const generatedImage = generatedPart?.inlineData?.data;

    if (!generatedImage) {
      console.error("Gemini Response:", JSON.stringify(response, null, 2));
      throw new Error("No images generated in Gemini response");
    }

    return { id, restoredImage: `data:image/jpeg;base64,${generatedImage}` };
  }

  async getStatus(id: string): Promise<GenerationResult> {
    return { status: "failed", error: "Google provider uses synchronous generation" };
  }
}

export function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || "replicate";
  if (provider === "google") {
    return new GoogleGenAIProvider();
  }
  return new ReplicateProvider();
}
