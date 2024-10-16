// /pages/index.js (or wherever your HomePage component is located)

import { SignedIn, SignedOut} from "@clerk/nextjs";
import { auth } from '@clerk/nextjs/server'
import { db } from "@/app/server/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Function to fetch the current user's images with type 'processed'
async function Images() {
    const { userId } = await auth(); // Get the current user's ID from Clerk

    if (!userId) {
        return <p>No user detected, please sign in.</p>;
    }

    // Query to fetch images for the current user where type is 'processed'
    const images = await db.query.images.findMany({
        where: (images, { eq, and }) =>
            and(eq(images.userId, userId), eq(images.type, 'processed')),
    });

    if (images.length === 0) {
        return <p>No processed images found for the current user.</p>;
    }

    return (
        <div className="flex flex-col p-4">
            <p className="text-red-500 mb-4">*Chú ý: Chỉ lưu trữ dữ liệu trong ngày, 
                hãy <Link href="/dashboard/feedback" className="text-blue-500">liên hệ</Link> với chúng tôi để lưu trữ dữ liệu lâu dài.</p>
            
            <div className="flex flex-wrap justify-center gap-4">
                {images.map((image) => (
                    <div key={image.id} className="w-48 h-48 flex items-center justify-center">
                        <a href={`${image.url}`}>
                            <img
                                src={image.url}
                                alt="image"
                                className="object-cover w-full h-full rounded-md" // Optional: Add styling for images
                            />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default async function HomePage() {
    const { userId } = await auth(); // Fetch the current user ID on the server side

    if (!userId) {
        return (
            <main>
                <SignedOut>
                    <div className='h-full w-full text-2xl'>
                        <h1>Sign in to view your images</h1>
                    </div>
                </SignedOut>
            </main>
        );
    }

    return (
        <main className="">
            <SignedIn>
                <h1 className="text-2xl">Images</h1>
                <Images />
            </SignedIn>
        </main>
    );
}
