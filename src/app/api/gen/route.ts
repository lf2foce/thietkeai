import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';

export const maxDuration = 60; // This function can run for a maximum of 5 seconds

export async function POST(request: NextRequest) {
  const { imageUrl, theme, room } = await request.json();
  
  // POST request to Replicate to start the image restoration generation process
  let startResponse = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
    },
    body: JSON.stringify({
      version: "76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
      input: {
        image: imageUrl.startsWith('/') ? `https://yourdomain.com${imageUrl}` : imageUrl,
        prompt: room === "Bedroom"
          ? "A bedroom with a bohemian spirit centered around a relaxed canopy bed complemented by a large macrame wall hanging. An eclectic dresser serves as a unique storage solution while an array of potted plants brings life and color to the room"
          : `a ${theme.toLowerCase()} ${room.toLowerCase()}`,
        guidance_scale: 15,
        negative_prompt: "lowres, watermark, banner, logo, watermark, contactinfo, text, deformed, blurry, blur, out of focus, out of frame, surreal, extra, ugly, upholstered walls, fabric walls, plush walls, mirror, mirrored, functional, realistic",
        prompt_strength: 0.8,
        num_inference_steps: 50,
      },
    }),
  });

  let jsonStartResponse = await startResponse.json();
  console.log("jsonStartResponse:", jsonStartResponse);

  let endpointUrl = jsonStartResponse.urls.get;

  // GET request to get the status of the image restoration process & return the result when it's ready
  let restoredImage: string | null = null;
  while (!restoredImage) {
    console.log("polling for result...");
    let finalResponse = await fetch(endpointUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
      },
    });
    let jsonFinalResponse = await finalResponse.json();

    if (jsonFinalResponse.status === "succeeded") {
      restoredImage = jsonFinalResponse.output;
    } else if (jsonFinalResponse.status === "failed") {
      break;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  console.log("restoredImage:", restoredImage);

  return NextResponse.json(
    restoredImage ? { restoredImage } : { error: "Failed to restore image" }
  );
}
