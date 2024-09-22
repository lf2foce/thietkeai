import { NextResponse } from 'next/server';
import { UTApi } from "uploadthing/server";
import { db } from "@/app/server/db";
import { images } from "@/app/server/db/schema";

import { auth } from "@clerk/nextjs/server";


const utapi = new UTApi();

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { imageUrl, originalImageId } = await req.json(); //userId, 
    const fileName = `processed_image_${Date.now()}`;
    // Upload the image to UploadThing
    const uploadedImage = await utapi.uploadFilesFromUrl(imageUrl,{
        metadata: { originalImageId }, //userId, 
        contentDisposition: `inline`, // Set content di sposition to 'inline'
        // contentType: "image/jpeg", 
      });

    if (!uploadedImage.data) {
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    // Insert the image data into your database
    const insertedImage = await db.insert(images).values({
      url: uploadedImage.data.url,
      userId: userId,
      name: fileName,
      design: 'interior',
      type: 'processed',
      originalImageId: originalImageId
    }).returning();

    return NextResponse.json({ url: insertedImage[0].url });
  } catch (error) {
    console.error("Error in uploadProcessedImage:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}