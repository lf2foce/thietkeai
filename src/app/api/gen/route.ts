import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';

const roomPrompts = {
  Bedroom: {
    Modern: "A modern bedroom featuring a sleek design with a low-profile bed, minimalist decor, and soft lighting.",
    Minimalist: "A minimalist bedroom with clean lines, neutral colors, and a focus on simplicity and functionality.",
    Professional: "A professional bedroom designed for productivity, featuring a comfortable workspace and organized layout.",
    Tropical: "A tropical bedroom with vibrant colors, natural materials, and a relaxing atmosphere.",
    Vintage: "A vintage bedroom with classic furniture, floral patterns, and a nostalgic charm.",
    Summer: "A bright and airy summer-themed bedroom with light fabrics, seaside accents, and plenty of natural sunlight.",
    Coastal: "A coastal bedroom with blue and white tones, rattan furniture, and ocean-inspired decor.",
    Industrial: "An industrial bedroom featuring exposed brick walls, metal accents, and a modern aesthetic.",
    Neoclassic: "A neoclassical bedroom with elegant moldings, a grand headboard, and sophisticated classical decor.",
    Tribal: "A tribal-inspired bedroom with ethnic patterns, handcrafted wooden elements, and warm earth tones.",
  },
  "Living Room": {
    Modern: "A modern living room with a plush sofa, geometric coffee table, and large windows allowing natural light to flood the space.",
    Minimalist: "A minimalist living room with clean lines, neutral colors, and a focus on simplicity.",
    Professional: "A sleek professional living room with premium furniture, an organized layout, and a sophisticated atmosphere.",
    Tropical: "A luxury tropical living room with lush indoor plants, bamboo textures, and a bright, airy feel.",
    Vintage: "A cozy vintage living room with mid-century modern furniture, retro decor, and warm lighting.",
    Summer: "A vibrant summer living room with light breezy curtains, colorful accents, and a fresh, sunny atmosphere.",
    Coastal: "A beautiful coastal living room with white-washed wood, nautical elements, and a calm seaside palette.",
    Industrial: "An industrial-style living room featuring exposed brick walls, metal accents, and vintage leather furniture.",
    Neoclassic: "An elegant neoclassical living room with classical columns, grand chandeliers, and sophisticated furniture.",
    Tribal: "A tribal living room with handcrafted ethnic decor, patterned rugs, and natural textures.",
  },
  Kitchen: {
    Modern: "A modern kitchen with sleek countertops, stainless steel appliances, and an open layout.",
    Minimalist: "A minimalist kitchen with clean lines, a simple color palette, and functional design.",
    Professional: "A professional kitchen equipped with high-end appliances and ample workspace for cooking.",
    Tropical: "A tropical kitchen with bright colors, natural materials, and a fresh, inviting atmosphere.",
    Vintage: "A vintage kitchen with retro appliances, classic cabinetry, and charming decor.",
    Summer: "A sunny summer kitchen with light wood, fresh herbs, and a bright, cheerful design.",
    Coastal: "A coastal kitchen with sea-glass colors, white cabinetry, and a relaxed beach-house feel.",
    Industrial: "An industrial kitchen featuring metal accents, open shelving, and a modern aesthetic.",
    Neoclassic: "A neoclassical kitchen with ornate cabinetry, marble countertops, and elegant light fixtures.",
    Tribal: "A tribal-inspired kitchen with unique textures, handcrafted details, and warm natural tones.",
  },
  Bathroom: {
    Modern: "A modern bathroom with sleek fixtures, clean lines, and a minimalist design.",
    Minimalist: "A minimalist bathroom with a focus on simplicity, featuring neutral colors and functional design.",
    Professional: "A professional bathroom designed for efficiency, featuring ample storage and modern fixtures.",
    Tropical: "A tropical bathroom with vibrant colors, natural materials, and a spa-like atmosphere.",
    Vintage: "A vintage bathroom with classic fixtures, patterned tiles, and a nostalgic charm.",
    Summer: "A bright summer bathroom with light colors, airy curtains, and a fresh, clean feel.",
    Coastal: "A coastal bathroom with shell decor, blue accents, and a relaxed seaside vibe.",
    Industrial: "An industrial bathroom featuring metal fixtures, exposed pipes, and a modern aesthetic.",
    Neoclassic: "A neoclassical bathroom with marble finishes, elegant gold fixtures, and classical details.",
    Tribal: "A tribal bathroom with ethnic patterns, natural stone elements, and a unique cultural touch.",
  },
  Office: {
    Modern: "A modern home office with a large desk, ergonomic chair, and shelves filled with books and decorative items.",
    Minimalist: "A minimalist office space with a simple desk, clean lines, and a focus on productivity.",
    Professional: "A professional office designed for efficiency, featuring ample workspace and organized storage.",
    Tropical: "A tropical office with bright colors, natural materials, and a refreshing atmosphere.",
    Vintage: "A vintage office with classic furniture, warm colors, and a nostalgic charm.",
    Summer: "A bright summer home office with light furniture, sunny views, and a fresh, inspiring atmosphere.",
    Coastal: "A coastal office with light wood, nautical accents, and a peaceful beach-house feel.",
    Industrial: "An industrial office featuring metal accents, open shelving, and a modern aesthetic.",
    Neoclassic: "A neoclassical office with a grand desk, elegant moldings, and sophisticated decor.",
    Tribal: "A tribal-inspired office with handcrafted elements, ethnic patterns, and a warm, creative vibe.",
  },
  "Dining Room": {
    Modern: "A modern dining room with a sleek table, contemporary chairs, and elegant lighting.",
    Minimalist: "A minimalist dining room with clean lines, a simple color palette, and functional design.",
    Professional: "A professional dining room designed for meetings, featuring a large table and comfortable seating.",
    Tropical: "A tropical dining room with bright colors, natural materials, and a fresh, inviting atmosphere.",
    Vintage: "A vintage dining room with classic furniture, patterned tablecloths, and charming decor.",
    Summer: "A bright summer dining room with light linens, fresh flowers, and a sunny, festive atmosphere.",
    Coastal: "A coastal dining room with driftwood furniture, blue accents, and a relaxed seaside feel.",
    Industrial: "An industrial dining room featuring metal accents, open shelving, and a modern aesthetic.",
    Neoclassic: "A neoclassical dining room with a grand table, elegant chandelier, and classical moldings.",
    Tribal: "A tribal dining room with ethnic patterns, handcrafted table settings, and warm natural textures.",
  },
  "Gaming Room": {
    Modern: "A modern gaming room with sleek gaming setups, LED lighting, and comfortable seating.",
    Minimalist: "A minimalist gaming room with clean lines, a simple color palette, and functional design.",
    Professional: "A professional gaming room designed for eSports, featuring high-end equipment and ample space.",
    Tropical: "A tropical gaming room with vibrant colors, natural materials, and a fun atmosphere.",
    Vintage: "A vintage gaming room with retro gaming consoles, classic decor, and nostalgic charm.",
    Summer: "A bright summer gaming room with neon lights, tropical accents, and a high-energy vibe.",
    Coastal: "A coastal gaming room with light wood, blue LED accents, and a relaxed beach-house style.",
    Industrial: "An industrial gaming room featuring metal accents, exposed pipes, and a modern aesthetic.",
    Neoclassic: "A neoclassical gaming room with sophisticated furniture, classical decor, and a unique high-end feel.",
    Tribal: "A tribal-inspired gaming room with unique handcrafted decor, ethnic patterns, and a creative atmosphere.",
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