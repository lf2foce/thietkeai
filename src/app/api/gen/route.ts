import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  console.log("POST request received");
  const { imageUrl, theme, room } = await request.json();
  console.log("Request body:", { imageUrl, theme, room });
  
  try {
    // POST request to Replicate to start the image restoration generation process
    console.log("Sending request to Replicate");
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

    console.log("Replicate response status:", startResponse.status);
    let jsonStartResponse = await startResponse.json();
    console.log("jsonStartResponse:", jsonStartResponse);

    return NextResponse.json({ id: jsonStartResponse.id });
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log("GET request received");
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  console.log("Requested ID:", id);

  if (!id) {
    console.log("Missing ID parameter");
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const endpointUrl = `https://api.replicate.com/v1/predictions/${id}`;
  console.log("Fetching from URL:", endpointUrl);

  try {
    let finalResponse = await fetch(endpointUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
      },
    });
    console.log("Replicate response status:", finalResponse.status);
    let jsonFinalResponse = await finalResponse.json();
    console.log("jsonFinalResponse:", jsonFinalResponse);

    if (jsonFinalResponse.status === "succeeded") {
      console.log("Job succeeded");
      return NextResponse.json({ status: "succeeded", restoredImage: jsonFinalResponse.output });
    } else if (jsonFinalResponse.status === "failed") {
      console.log("Job failed");
      return NextResponse.json({ status: "failed", error: "Image restoration failed" });
    } else {
      console.log("Job still processing");
      return NextResponse.json({ status: "processing" });
    }
  } catch (error) {
    console.error("Error in GET request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
