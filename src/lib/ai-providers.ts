import { GoogleGenAI, createPartFromUri } from '@google/genai';

const GEMINI_MODELS = {
  standard:        process.env.GEMINI_MODEL_STANDARD         || 'models/gemini-3.1-flash-image-preview',
  premium:         process.env.GEMINI_MODEL_PREMIUM          || 'models/gemini-3.1-flash-image-preview',
  styleRefStandard: process.env.GEMINI_MODEL_STYLE_REF_STANDARD || 'models/gemini-3.1-flash-image-preview',
  styleRefPremium:  process.env.GEMINI_MODEL_STYLE_REF_PREMIUM  || 'models/gemini-3.1-flash-image-preview',
};

export interface GenerationResult {
  status: "succeeded" | "failed" | "processing";
  restoredImage?: string;
  error?: string;
}

export interface AIProvider {
  generate(
    imageInput: string | Blob | Array<string | Blob>,
    prompt: string,
    room?: string,
    quality?: string,
  ): Promise<{ id: string; restoredImage?: string }>;
  getStatus(id: string): Promise<GenerationResult>;
}

function nowMs() {
  return Date.now();
}

function elapsedMs(startMs: number) {
  return Date.now() - startMs;
}

export class ReplicateProvider implements AIProvider {
  async generate(imageInput: string | Blob | Array<string | Blob>, prompt: string, room?: string, _quality?: string): Promise<{ id: string }> {
    const mainImage = Array.isArray(imageInput) ? imageInput[0] : imageInput;
    if (typeof mainImage !== "string") {
      throw new Error("Replicate provider requires image URLs and does not support direct file uploads");
    }

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
      },
      body: JSON.stringify({
        version: "76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
        input: {
          image: mainImage,
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

  private logTiming(stage: string, metadata: Record<string, unknown>) {
    console.log(`[gemini-timing] ${stage}`, metadata);
  }

  private async resolveImageInput(
    imageInput: string | Blob,
    requestId: string,
    index: number,
  ): Promise<{ blob: Blob; mimeType: string; source: "remote-url" | "direct-upload" }> {
    if (typeof imageInput === "string") {
      const { blob, mimeType } = await this.fetchRemoteImageAsBlob(imageInput);
      return { blob, mimeType, source: "remote-url" };
    }

    const mimeType = imageInput.type || "image/jpeg";
    this.logTiming('use-direct-upload-image', {
      requestId,
      index,
      mimeType,
      sizeBytes: imageInput.size,
    });
    return {
      blob: imageInput,
      mimeType,
      source: "direct-upload",
    };
  }

  private async fetchRemoteImageAsBlob(url: string): Promise<{ blob: Blob; mimeType: string }> {
    const startMs = nowMs();
    const imageRes = await fetch(url);
    if (!imageRes.ok) {
      throw new Error(`Failed to fetch image: ${imageRes.status} ${imageRes.statusText}`);
    }

    const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';
    const blob = await imageRes.blob();
    this.logTiming('fetch-remote-image', {
      url,
      mimeType,
      sizeBytes: blob.size,
      durationMs: elapsedMs(startMs),
    });
    return { blob, mimeType };
  }

  private async generateWithInlineImage(
    imageInput: string | Blob,
    finalPrompt: string,
    requestId: string,
    quality?: string,
  ): Promise<{ restoredImage: string }> {
    const fetchStartMs = nowMs();
    const { blob, mimeType, source } = await this.resolveImageInput(imageInput, requestId, 0);
    this.logTiming('inline-image-ready', {
      requestId,
      imageCount: 1,
      source,
      mimeType,
      sizeBytes: blob.size,
      durationMs: elapsedMs(fetchStartMs),
    });

    const encodeStartMs = nowMs();
    const imageBuffer = await blob.arrayBuffer();
    const encodedImage = Buffer.from(imageBuffer).toString('base64');
    this.logTiming('inline-image-encoded', {
      requestId,
      imageCount: 1,
      mimeType,
      originalBytes: imageBuffer.byteLength,
      base64Chars: encodedImage.length,
      durationMs: elapsedMs(encodeStartMs),
    });

    const model = quality === "Pro - 2 credits" ? GEMINI_MODELS.premium : GEMINI_MODELS.standard;
    const generateStartMs = nowMs();
    const response = await this.ai.models.generateContent({
      model,
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              data: encodedImage,
              mimeType,
            },
          },
          { text: finalPrompt },
        ],
      }],
      config: { responseModalities: ["IMAGE"] },
    });
    this.logTiming('generate-content-complete', {
      requestId,
      mode: 'inline',
      imageCount: 1,
      promptLength: finalPrompt.length,
      durationMs: elapsedMs(generateStartMs),
    });

    const generatedPart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
    const generatedImage = generatedPart?.inlineData?.data;

    if (!generatedImage) {
      console.error("Gemini Response:", JSON.stringify(response, null, 2));
      throw new Error("No images generated in Gemini response");
    }

    return { restoredImage: `data:image/jpeg;base64,${generatedImage}` };
  }

  private async generateWithGeminiFiles(
    imageInputs: Array<string | Blob>,
    finalPrompt: string,
    requestId: string,
    quality?: string,
  ): Promise<{ restoredImage: string }> {
    const uploadBatchStartMs = nowMs();
    const uploadedFiles = await Promise.all(
      imageInputs.map(async (imageInput, index) => {
        const fetchStartMs = nowMs();
        const { blob, mimeType, source } = await this.resolveImageInput(imageInput, requestId, index);
        this.logTiming('style-ref-image-ready', {
          requestId,
          index,
          source,
          mimeType,
          sizeBytes: blob.size,
          durationMs: elapsedMs(fetchStartMs),
        });

        const uploadStartMs = nowMs();
        const file = await this.ai.files.upload({
          file: blob,
          config: { mimeType },
        });
        this.logTiming('gemini-file-uploaded', {
          requestId,
          index,
          mimeType,
          localBytes: blob.size,
          fileName: file.name,
          fileUri: file.uri,
          durationMs: elapsedMs(uploadStartMs),
        });
        return file;
      })
    );
    this.logTiming('gemini-file-batch-complete', {
      requestId,
      imageCount: imageInputs.length,
      uploadedCount: uploadedFiles.length,
      durationMs: elapsedMs(uploadBatchStartMs),
    });

    const fileParts = uploadedFiles
      .filter((file) => file.uri && file.mimeType)
      .map((file) => createPartFromUri(file.uri!, file.mimeType!));

    if (fileParts.length === 0) {
      throw new Error("No valid Gemini file references were created");
    }

    const model = quality === "Pro - 2 credits" ? GEMINI_MODELS.styleRefPremium : GEMINI_MODELS.styleRefStandard;
    const generateStartMs = nowMs();
    const response = await this.ai.models.generateContent({
      model,
      contents: [{
        role: 'user',
        parts: [
          ...fileParts,
          { text: finalPrompt },
        ],
      }],
      config: { responseModalities: ["IMAGE"] },
    });
    this.logTiming('generate-content-complete', {
      requestId,
      mode: 'files-api',
      imageCount: fileParts.length,
      promptLength: finalPrompt.length,
      durationMs: elapsedMs(generateStartMs),
    });

    const generatedPart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
    const generatedImage = generatedPart?.inlineData?.data;

    if (!generatedImage) {
      console.error("Gemini Response:", JSON.stringify(response, null, 2));
      throw new Error("No images generated in Gemini response");
    }

    void Promise.all(
      uploadedFiles
        .filter((file) => file.name)
        .map(async (file) => {
          try {
            const deleteStartMs = nowMs();
            await this.ai.files.delete({ name: file.name! });
            this.logTiming('gemini-file-deleted', {
              requestId,
              fileName: file.name,
              durationMs: elapsedMs(deleteStartMs),
            });
          } catch (error) {
            console.warn(`Failed to delete Gemini file ${file.name}:`, error);
          }
        })
    );

    return { restoredImage: `data:image/jpeg;base64,${generatedImage}` };
  }

  async generate(
    imageInput: string | Blob | Array<string | Blob>,
    prompt: string,
    room?: string,
    quality?: string,
  ): Promise<{ id: string; restoredImage?: string }> {
    const id = `google_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const imageInputs = Array.isArray(imageInput) ? imageInput : [imageInput];
    const totalStartMs = nowMs();

    const finalPrompt = imageInputs.length > 1
      ? `Original room is the first image. Use the remaining images as style references. ${prompt} Output the result as a photorealistic image.`
      : `${prompt} Output the result as a photorealistic image.`;

    this.logTiming('generate-start', {
      requestId: id,
      room,
      imageCount: imageInputs.length,
      promptLength: finalPrompt.length,
      mode: imageInputs.length > 1 ? 'files-api' : 'inline',
    });

    const result = imageInputs.length > 1
      ? await this.generateWithGeminiFiles(imageInputs, finalPrompt, id, quality)
      : await this.generateWithInlineImage(imageInputs[0], finalPrompt, id, quality);

    this.logTiming('generate-finished', {
      requestId: id,
      room,
      imageCount: imageInputs.length,
      totalDurationMs: elapsedMs(totalStartMs),
      mode: imageInputs.length > 1 ? 'files-api' : 'inline',
    });

    return { id, restoredImage: result.restoredImage };
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
