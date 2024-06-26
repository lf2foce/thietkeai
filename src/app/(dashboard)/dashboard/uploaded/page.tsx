
import { SignedIn, SignedOut } from "@clerk/nextjs";
// import Image from "next/image";
// import Link from "next/link";
import { db } from "@/app/server/db";
// import { getMyImages } from "~/server/queries";

export const dynamic = "force-dynamic";

const mockUrls = [
    'https://utfs.io/f/1f9c567a-c1a0-4c48-af0c-30487810d0e2-dkiuwk.42.31.png',
    'https://utfs.io/f/989333d2-cbaa-40b3-b2d0-7f2dfb3c81a0-kpbxl.47.34.png'
];

const mockImages = mockUrls.map((url, index) => ({
    id: Math.random().toString(36).substring(2), // id: index +1
    // name: url.split('/').pop(),
    url,
}));

async function Images() {
    const images = await db.query.images.findMany();
    // console.log(images);
    return (
        <div className="flex flex-wrap justify-center gap-4 p-4">
        {images.map((image) => (
            <div key={image.id} className="w-48 h-48 flex items-center justify-center">
            <a href={`/img/${image.id}`}>
                <img
                src={image.url}
                //   style={{ objectFit: "contain" }}
                //   width={192}
                //   height={192}
                alt='image'
                />
            </a>
            {/* <div>{image.name}</div> */}
            </div>
      ))}
      </div>
    );
}

export default async function HomePage() {
//   const images = await getMyImages();

  return (
    <main className="">
        <SignedOut>
            <div className='h-full w-full text-2xl'>
                <h1>Sign in to view your images</h1>
            </div>
        </SignedOut>
        <SignedIn>
        <h1 className="text-2xl">Images</h1>
        <Images />
        </SignedIn>
      </main>
  )};