import { db } from "@/app/server/db";
import { images } from "@/app/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";

const f = createUploadthing();
 
// const auth = (req: Request) => ({ id: "fakeId" }); // Fake auth function
 
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .input(z.object({
      design: z.string(),
      type: z.string()
    }))
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req, input }) => {
      // This code runs on your server before upload
      const user = auth();
 
      // If you throw, the user will not be able to upload
      if (!user.userId) throw new UploadThingError("Unauthorized");
      
      const { design, type } =  input;
      
      if (!design || !type) {
        throw new UploadThingError("Missing design or type parameters");
      }
      
      return { userId: user.userId, design, type };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
 
        await db.insert(images).values({ 
            name: file.name,
            url: file.url,
            userId: metadata.userId,
            design: metadata.design,
            type: metadata.type,
        });
      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;