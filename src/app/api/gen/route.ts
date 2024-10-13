import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';

const roomPrompts = {
  Bedroom: {
    Modern: "A modern bedroom featuring a sleek design with a low-profile bed, minimalist decor, and soft lighting.",
    Minimalist: "A minimalist bedroom with clean lines, neutral colors, and a focus on simplicity and functionality.",
    Professional: "A professional bedroom designed for productivity, featuring a comfortable workspace and organized layout.",
    Tropical: "A tropical bedroom with vibrant colors, natural materials, and a relaxing atmosphere.",
    Vintage: "A vintage bedroom with classic furniture, floral patterns, and a nostalgic charm.",
    Rustic: "A rustic bedroom with wooden beams, cozy textiles, and a warm, inviting feel.",
    Industrial: "An industrial bedroom featuring exposed brick walls, metal accents, and a modern aesthetic.",
    Cozy: "A cozy bedroom with warm colors, soft bedding, and a comfortable reading nook.",
    Elegant: "An elegant bedroom with luxurious fabrics, sophisticated decor, and a serene ambiance.",
    Casual: "A casual bedroom with a relaxed vibe, featuring comfortable furnishings and a laid-back style.",
  },
  "Living Room": {
    Modern: "A modern living room with a plush sofa, geometric coffee table, and large windows allowing natural light to flood the space.",
    Minimalist: "A minimalist living room with clean lines, neutral colors, and a focus on simplicity.",
    Professional: "A professional living room designed for meetings, featuring a large table and comfortable seating.",
    Tropical: "A tropical living room with bright colors, natural materials, and a relaxed atmosphere.",
    Vintage: "A vintage living room with classic furniture, patterned rugs, and a nostalgic feel.",
    Rustic: "A rustic living room with wooden furniture, a stone fireplace, and cozy textiles.",
    Industrial: "An industrial-style living room featuring exposed brick walls, metal accents, and vintage furniture.",
    Cozy: "A cozy living room with warm colors, a comfortable sofa, and a fireplace, creating a welcoming atmosphere.",
    Elegant: "An elegant living room with luxurious furnishings, beautiful artwork, and a sophisticated ambiance.",
    Casual: "A casual living room with a relaxed vibe, perfect for family gatherings and informal entertaining.",
  },
  Kitchen: {
    Modern: "A modern kitchen with sleek countertops, stainless steel appliances, and an open layout.",
    Minimalist: "A minimalist kitchen with clean lines, a simple color palette, and functional design.",
    Professional: "A professional kitchen equipped with high-end appliances and ample workspace for cooking.",
    Tropical: "A tropical kitchen with bright colors, natural materials, and a fresh, inviting atmosphere.",
    Vintage: "A vintage kitchen with retro appliances, classic cabinetry, and charming decor.",
    Rustic: "A rustic kitchen with wooden cabinets, farmhouse sink, and vintage decor, creating a warm and inviting atmosphere.",
    Industrial: "An industrial kitchen featuring metal accents, open shelving, and a modern aesthetic.",
    Cozy: "A cozy kitchen with warm colors, comfortable seating, and a welcoming atmosphere.",
    Elegant: "An elegant kitchen with luxurious finishes, beautiful lighting, and a sophisticated design.",
    Casual: "A casual kitchen with a relaxed vibe, perfect for family meals and gatherings.",
  },
  Bathroom: {
    Modern: "A modern bathroom with sleek fixtures, clean lines, and a minimalist design.",
    Minimalist: "A minimalist bathroom with a focus on simplicity, featuring neutral colors and functional design.",
    Professional: "A professional bathroom designed for efficiency, featuring ample storage and modern fixtures.",
    Tropical: "A tropical bathroom with vibrant colors, natural materials, and a spa-like atmosphere.",
    Vintage: "A vintage bathroom with classic fixtures, patterned tiles, and a nostalgic charm.",
    Rustic: "A rustic bathroom with wooden accents, natural stone, and a warm, inviting feel.",
    Industrial: "An industrial bathroom featuring metal fixtures, exposed pipes, and a modern aesthetic.",
    Cozy: "A cozy bathroom with warm colors, soft lighting, and a relaxing atmosphere.",
    Elegant: "An elegant bathroom with luxurious finishes, beautiful fixtures, and a serene ambiance.",
    Casual: "A casual bathroom with a relaxed vibe, featuring comfortable amenities and a welcoming atmosphere.",
  },
  Office: {
    Modern: "A modern home office with a large desk, ergonomic chair, and shelves filled with books and decorative items.",
    Minimalist: "A minimalist office space with a simple desk, clean lines, and a focus on productivity.",
    Professional: "A professional office designed for efficiency, featuring ample workspace and organized storage.",
    Tropical: "A tropical office with bright colors, natural materials, and a refreshing atmosphere.",
    Vintage: "A vintage office with classic furniture, warm colors, and a nostalgic charm.",
    Rustic: "A rustic office with wooden furniture, cozy textiles, and a warm, inviting feel.",
    Industrial: "An industrial office featuring metal accents, open shelving, and a modern aesthetic.",
    Cozy: "A cozy office with warm colors, comfortable seating, and a relaxed atmosphere.",
    Elegant: "An elegant office with luxurious furnishings, beautiful decor, and a sophisticated ambiance.",
    Casual: "A casual office with a relaxed vibe, perfect for creative work and brainstorming.",
  },
  "Dining Room": {
    Modern: "A modern dining room with a sleek table, contemporary chairs, and elegant lighting.",
    Minimalist: "A minimalist dining room with clean lines, a simple color palette, and functional design.",
    Professional: "A professional dining room designed for meetings, featuring a large table and comfortable seating.",
    Tropical: "A tropical dining room with bright colors, natural materials, and a fresh, inviting atmosphere.",
    Vintage: "A vintage dining room with classic furniture, patterned tablecloths, and charming decor.",
    Rustic: "A rustic dining room with wooden furniture, a cozy atmosphere, and a warm color palette.",
    Industrial: "An industrial dining room featuring metal accents, open shelving, and a modern aesthetic.",
    Cozy: "A cozy dining room with warm colors, comfortable seating, and a welcoming atmosphere.",
    Elegant: "An elegant dining room with luxurious furnishings, beautiful table settings, and a sophisticated ambiance.",
    Casual: "A casual dining room with a relaxed vibe, perfect for family gatherings and informal meals.",
  },
  "Gaming Room": {
    Modern: "A modern gaming room with sleek gaming setups, LED lighting, and comfortable seating.",
    Minimalist: "A minimalist gaming room with clean lines, a simple color palette, and functional design.",
    Professional: "A professional gaming room designed for eSports, featuring high-end equipment and ample space.",
    Tropical: "A tropical gaming room with vibrant colors, natural materials, and a fun atmosphere.",
    Vintage: "A vintage gaming room with retro gaming consoles, classic decor, and nostalgic charm.",
    Rustic: "A rustic gaming room with wooden furniture, cozy textiles, and a warm, inviting feel.",
    Industrial: "An industrial gaming room featuring metal accents, exposed pipes, and a modern aesthetic.",
    Cozy: "A cozy gaming room with warm colors, comfortable seating, and a relaxed atmosphere.",
    Elegant: "An elegant gaming room with luxurious furnishings, beautiful decor, and a sophisticated ambiance.",
    Casual: "A casual gaming room with a relaxed vibe, perfect for informal gaming sessions with friends.",
  },
};

export async function POST(request: NextRequest) {
  console.log("POST request received");
  const { imageUrl, theme, room } = await request.json();
  console.log("Request body:", { imageUrl, theme, room });
  
  // Check if the room and theme exist in the roomPrompts
  const prompt = roomPrompts[room]?.[theme] || "A beautiful room."; // Fallback prompt if not found

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
          prompt: prompt, // Use the dynamic prompt based on room and theme
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