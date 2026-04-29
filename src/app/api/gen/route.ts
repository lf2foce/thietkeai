import { after, NextResponse } from "next/server";
import { NextRequest } from 'next/server';
import { getProvider } from "@/lib/ai-providers";
import { UTApi, UTFile } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/server/db";
import { images } from "@/app/server/db/schema";
import { getOrCreateUser, consumeQuota, refundQuota, logGeneration } from "@/app/server/db/credits";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const styleDescriptions: Record<string, Record<string, string>> = {
  Bedroom: {
    Modern: "sleek low-profile bed, minimalist nightstands, recessed lighting, neutral tones with clean geometric lines",
    Minimalist: "simple platform bed, neutral palette, uncluttered surfaces, functional minimal decor",
    Professional: "organized layout, quality bedding, dedicated workspace corner, refined neutral tones",
    Tropical: "rattan headboard, lush indoor plants, vibrant accent colors, natural woven textiles",
    Vintage: "ornate wooden bed frame, floral patterns, warm amber lighting, retro decorative accents",
    Summer: "light linen fabrics, breezy sheer curtains, pastel seaside accents, abundant natural light",
    Coastal: "white-washed wood, blue and white tones, rattan furniture, ocean-inspired accessories",
    Industrial: "exposed brick accent wall, metal bed frame, Edison bulbs, raw concrete and aged wood",
    Neoclassic: "grand tufted headboard, crown moldings, elegant chandelier, symmetrical classical decor",
    Tribal: "handcrafted wooden elements, ethnic patterned textiles, warm earth tones, artisan accessories",
  },
  "Living Room": {
    Modern: "plush sectional sofa, geometric coffee table, statement pendant lights, large floor-to-ceiling windows",
    Minimalist: "low-profile sofa, monochromatic palette, open space, single art piece, hidden storage",
    Professional: "premium leather seating, structured layout, refined color scheme, sophisticated lighting",
    Tropical: "lush indoor palms, bamboo textures, rattan furniture, bright cushions, natural woven rugs",
    Vintage: "mid-century modern sofa, retro floor lamp, warm wood tones, vintage art and decorative objects",
    Summer: "light breezy linen curtains, colorful throw pillows, fresh flowers, sunny airy atmosphere",
    Coastal: "white-washed wood furniture, nautical accents, rope details, calm blue-white-sand palette",
    Industrial: "exposed brick wall, metal and leather sofa, Edison bulb fixtures, reclaimed wood coffee table",
    Neoclassic: "grand sofa with gold trim, classical columns, elaborate chandelier, ornate moldings",
    Tribal: "handcrafted patterned rugs, natural fiber cushions, wooden tribal art pieces, warm earth tones",
  },
  Kitchen: {
    Modern: "sleek handleless cabinetry, quartz countertops, stainless steel appliances, integrated lighting",
    Minimalist: "flat-front cabinets, single color palette, hidden appliances, clean uncluttered counters",
    Professional: "chef-grade appliances, ample prep space, pot rack, professional-quality finishes",
    Tropical: "bright cabinet colors, open shelving with plants, natural wood accents, fresh produce display",
    Vintage: "shaker cabinets, retro pastel appliances, classic subway tile, farmhouse sink",
    Summer: "light wood tones, open shelving with herbs, white marble counters, bright cheerful colors",
    Coastal: "sea-glass cabinet colors, white shiplap, beadboard details, driftwood accents",
    Industrial: "open metal shelving, concrete countertops, stainless fixtures, exposed ductwork",
    Neoclassic: "ornate raised-panel cabinets, marble countertops, decorative range hood, elegant hardware",
    Tribal: "hand-painted tile backsplash, handcrafted wooden details, warm terracotta tones, artisan pottery",
  },
  Bathroom: {
    Modern: "floating vanity, frameless glass shower, large format tiles, LED mirror, matte black fixtures",
    Minimalist: "vessel sink, neutral tiles, concealed storage, simple rectangular mirror, minimal decor",
    Professional: "double vanity, walk-in shower, ample storage, neutral refined finishes",
    Tropical: "natural stone tiles, rainfall showerhead, indoor plant, warm wood accents, spa-like ambiance",
    Vintage: "clawfoot tub, pedestal sink, hexagon floor tiles, brass fixtures, framed mirror",
    Summer: "light pastel tiles, sheer curtains, fresh white finishes, natural woven bath mat",
    Coastal: "pebble floor tiles, blue glass mosaic accents, driftwood accessories, seashell decor",
    Industrial: "exposed pipe fixtures, concrete sink, metro tiles, vintage Edison bulb vanity light",
    Neoclassic: "marble surfaces, gold fixtures, ornate mirror frame, freestanding bathtub, classical moldings",
    Tribal: "terracotta tiles, ethnic pattern bath mat, natural stone basin, handcrafted wooden accessories",
  },
  Office: {
    Modern: "large L-shaped desk, ergonomic chair, built-in shelving, cable management, clean minimal decor",
    Minimalist: "simple floating desk, single monitor, hidden storage, no-clutter surfaces, neutral tones",
    Professional: "executive desk, leather chair, organized bookshelves, professional diploma wall",
    Tropical: "bamboo desk, lush plants, bright colors, natural light, woven storage baskets",
    Vintage: "antique wooden desk, leather chair, warm bookshelves, vintage globe, warm lamp light",
    Summer: "white desk, natural light, potted succulents, cheerful accents, airy curtains",
    Coastal: "light wood desk, nautical artwork, wicker storage, blue accents, sea breeze atmosphere",
    Industrial: "metal and wood desk, pipe shelving, exposed brick, vintage file cabinets, Edison bulb lamp",
    Neoclassic: "grand writing desk, Chesterfield chair, floor-to-ceiling bookshelves, ornate moldings",
    Tribal: "handcrafted wooden desk, ethnic pattern rug, artisan pottery accents, warm ambient lighting",
  },
  "Dining Room": {
    Modern: "rectangular extendable table, sculptural chairs, geometric pendant light, minimal centerpiece",
    Minimalist: "simple table, monochromatic chairs, single pendant light, no clutter",
    Professional: "long conference-style table, upholstered chairs, sophisticated lighting, refined setting",
    Tropical: "round wooden table, colorful cushioned chairs, tropical floral centerpiece, wicker accents",
    Vintage: "farmhouse table, mismatched vintage chairs, candelabra, floral tablecloth, warm patina",
    Summer: "light wood table, linen chair covers, fresh flower centerpiece, bright festive atmosphere",
    Coastal: "driftwood table, cross-back chairs, lantern pendant, blue-white-sand linen",
    Industrial: "metal and reclaimed wood table, mixed metal chairs, factory pendant lights, exposed brick",
    Neoclassic: "grand oval table, Chippendale chairs, crystal chandelier, formal place settings, ornate moldings",
    Tribal: "round wooden table, handcrafted wicker chairs, ethnic runner, clay pottery centerpiece",
  },
  "Gaming Room": {
    Modern: "sleek gaming desk, racing chair, multi-monitor setup, RGB LED strip lighting, cable management",
    Minimalist: "minimal white desk, single monitor, wireless peripherals, clean hidden cable setup",
    Professional: "dual monitor stand, acoustic panels, professional streaming setup, organized peripherals",
    Tropical: "bright accent colors, tropical wall art, comfortable bean bags, fun energetic atmosphere",
    Vintage: "retro gaming console display, CRT monitor, vintage arcade cabinet, nostalgic neon signs",
    Summer: "neon accent lighting, colorful wall art, tropical gaming accents, high-energy vibrant decor",
    Coastal: "light wood desk, blue LED accents, surfboard wall art, relaxed beach-house gaming setup",
    Industrial: "metal pipe shelving for consoles, exposed brick, Edison bulbs, rugged industrial desk",
    Neoclassic: "ornate desk, velvet gaming chair, gallery wall with framed game art, elegant gold accents",
    Tribal: "handcrafted wooden desk, ethnic pattern rug, artisan decorative accents, warm ambient glow",
  },
};

const roomElectronics: Record<string, string> = {
  "Living Room": "a mounted flat-screen TV on the wall with a sleek media console below, set-top box, decorative items on shelves",
  Bedroom: "bedside lamps with smart plugs, a wall-mounted TV if space allows, an alarm clock, phone charger station",
  Kitchen: "built-in refrigerator, oven and stovetop, range hood, dishwasher, microwave, kettle, small appliances on counter",
  Bathroom: "towel warmer, modern hairdryer holder, electric toothbrush stand, LED mirror with backlight",
  Office: "desktop computer or laptop on desk, dual monitors, desk lamp, printer, cable management tray, USB hub",
  "Dining Room": "a statement chandelier or pendant light over the table, a sideboard with wine rack and glassware",
  "Gaming Room": "gaming PC tower or console (PS5/Xbox), dual monitors with RGB lighting, gaming headset stand, streaming mic, LED strip lights behind desk",
};

function buildPrompt(room: string, theme: string, roomCondition: "raw" | "finished"): string {
  const styleDetails = theme === "Custom Style"
    ? "the style shown in the reference images"
    : (styleDescriptions[room]?.[theme] || `${theme} style furnishings and decor`);
  const electronics = roomElectronics[room] || "appropriate appliances and electronics for the room";

  if (roomCondition === "raw") {
    return (
      `You are a professional interior design visualizer. ` +
      `GOAL: Create a COMPLETE INTERIOR DESIGN CONCEPT of this raw, empty, or under-construction ${room.toLowerCase()} — ` +
      `showing clients a full, inspiring vision of what the finished space will look like in ${theme} style. ` +
      `This is a design idea presentation: every surface, every corner must be fully designed and decorated so the viewer immediately understands the lifestyle this space offers. ` +

      `STRICT STRUCTURAL RULE: Preserve every wall, window frame, ceiling height, beam, concrete column, door opening, and room proportion EXACTLY as they appear in the original photo. Do NOT move, resize, or remove any architectural element. Only add on top. ` +

      `COMPLETE THE ENTIRE SPACE — nothing left bare: ` +
      `(1) SURFACES: ${theme}-style finished flooring across the entire floor, painted or textured walls, ceiling treatment with built-in cove or recessed lighting. ` +
      `(2) FURNITURE: Full furniture set filling all functional zones — ${styleDetails}. No empty corners, no unfurnished walls. ` +
      `(3) ELECTRONICS & APPLIANCES: ${electronics}. All fully installed, cables hidden, screens powered on showing content. ` +
      `(4) SOFT FURNISHINGS: Curtains or blinds on every window styled to the ${theme} palette, area rugs anchoring seating zones, cushions and throws layered on all seating. ` +
      `(5) DECORATIVE DETAILS: Artwork or mirrors on every significant wall, potted plants or greenery, books, candles, vases, table objects — layered and dense like a luxury show home ready for a magazine shoot. ` +
      `(6) LIGHTING ATMOSPHERE: Realistic warm ambient light complementing the natural light from the original windows; include lit pendant lights, floor lamps, and accent lighting appropriate to ${theme} style. ` +

      `OUTPUT: Photorealistic — indistinguishable from a professional interior photography shoot. Not a 3D render, not an illustration. The result must make the viewer say "I want to live here."`
    );
  } else {
    return (
      `Transform the interior style of this decorated ${room.toLowerCase()} to ${theme} theme. ` +
      `CRITICAL: Preserve the exact room layout — same camera angle, wall positions, window locations, ` +
      `ceiling structure, and spatial proportions must remain unchanged. ` +
      `Replace furniture, change wall colors, update fabrics, lighting fixtures, and decorative elements to: ${styleDetails}. ` +
      `Also update any visible electronics and appliances to match the ${theme} aesthetic: ${electronics}. ` +
      `Keep the photo's exact framing, perspective, and natural lighting direction. ` +
      `The result must look like a professional interior redesign photo for advertising use.`
    );
  }
}

function appendCustomPrompt(prompt: string, customPrompt?: string | null) {
  if (customPrompt && customPrompt.trim() !== "") {
    return `${prompt}\n\nUSER SPECIFIC INSTRUCTIONS: ${customPrompt.trim()}`;
  }

  return prompt;
}

async function persistOriginalRoomImage(
  file: File,
  originalImageId: string,
  userId?: string | null,
) {
  if (!userId) {
    return;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${originalImageId}-${file.name || "style-ref-room.jpg"}`;
  const uploadFile = new UTFile([buffer], fileName, {
    type: file.type || "image/jpeg",
    customId: originalImageId,
  });

  const response = await new UTApi().uploadFiles([uploadFile]);
  const uploadedImage = response[0];

  if (!uploadedImage?.data?.ufsUrl) {
    console.error("Background original upload failed:", uploadedImage?.error);
    return;
  }

  await db.insert(images).values({
    name: fileName,
    url: uploadedImage.data.ufsUrl,
    userId,
    design: "interior",
    type: "original",
    originalImageId,
  });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await getOrCreateUser(userId);
  const quota = await consumeQuota(userId);
  if (!quota.ok) {
    return NextResponse.json(
      { error: quota.message, reason: quota.reason },
      { status: 429 }
    );
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const theme = String(formData.get("theme") || "Custom Style");
    const room = String(formData.get("room") || "Living Room");
    const roomCondition = String(formData.get("roomCondition") || "raw");
    const customPrompt = String(formData.get("customPrompt") || "");
    const files = formData
      .getAll("images")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (files.length === 0) {
      await refundQuota(userId, quota.costType);
      return NextResponse.json({ error: "No image files were provided" }, { status: 400 });
    }

    const condition: "raw" | "finished" = roomCondition === "finished" ? "finished" : "raw";
    const prompt = appendCustomPrompt(buildPrompt(room, theme, condition), customPrompt);
    const provider = getProvider();
    const originalImageId = `style_ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const result = await provider.generate(files, prompt, room);

      after(async () => {
        await logGeneration({ userId, mode: "style-ref", status: "succeeded", costType: quota.costType, roomType: room, theme });
        if (files[0]) {
          try {
            await persistOriginalRoomImage(files[0], originalImageId, userId);
          } catch (error) {
            console.error("Failed to persist original style-ref room image:", error);
          }
        }
      });

      return NextResponse.json({
        id: result.id,
        status: "succeeded",
        restoredImage: result.restoredImage,
        originalImageId,
      });
    } catch (error: any) {
      console.error("Error in multipart POST request:", error);
      await refundQuota(userId, quota.costType);
      after(() => logGeneration({ userId, mode: "style-ref", status: "failed", costType: quota.costType, roomType: room, theme }));
      return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
  }

  const { imageUrl, imageUrls: multipleUrls, theme, room, roomCondition, customPrompt } = await request.json();
  const condition: "raw" | "finished" = roomCondition === "finished" ? "finished" : "raw";
  const prompt = appendCustomPrompt(buildPrompt(room, theme, condition), customPrompt);
  const imagesToProcess = multipleUrls || imageUrl;

  try {
    const provider = getProvider();
    const result = await provider.generate(imagesToProcess, prompt, room);

    after(() => logGeneration({ userId, mode: "standard", status: "succeeded", costType: quota.costType, roomType: room, theme }));

    if (result.restoredImage) {
      return NextResponse.json({ id: result.id, status: "succeeded", restoredImage: result.restoredImage });
    }
    return NextResponse.json({ id: result.id });
  } catch (error: any) {
    console.error("Error in POST request:", error);
    await refundQuota(userId, quota.costType);
    after(() => logGeneration({ userId, mode: "standard", status: "failed", costType: quota.costType, roomType: room, theme }));
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  try {
    const provider = getProvider();
    const result = await provider.getStatus(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in GET request:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
