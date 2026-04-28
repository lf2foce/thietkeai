import { NextResponse } from 'next/server';
import { UTApi } from "uploadthing/server";
import { db } from "@/app/server/db";
import { images } from "@/app/server/db/schema";

import { auth } from "@clerk/nextjs/server";


const utapi = new UTApi();

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { imageUrl, originalImageId } = await req.json();
    const fileName = `processed_image_${Date.now()}.jpg`;

    let uploadedImage;

    if (imageUrl.startsWith('data:')) {
      // Handle base64 data URL
      const base64Data = imageUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Create a File-like object or use the buffer directly if utapi supports it
      // utapi.uploadFiles expects an array of files
      const file = new File([buffer], fileName, { type: 'image/jpeg' });
      const response = await utapi.uploadFiles([file]);
      uploadedImage = response[0];
    } else {
      // Handle regular URL
      uploadedImage = await utapi.uploadFilesFromUrl(imageUrl, {
        metadata: { originalImageId },
        contentDisposition: `inline`,
      });
    }

    if (!uploadedImage || !uploadedImage.data) {
      console.error("UploadThing Error:", uploadedImage?.error);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    // Insert the image data into your database
    const insertedImage = await db.insert(images).values({
      url: uploadedImage.data.ufsUrl,
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