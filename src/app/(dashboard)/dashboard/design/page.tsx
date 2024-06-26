"use client";

import Image from "next/image";
import { UploadDropzone } from "@/utils/uploadthing";
import { useState } from "react";
import { roomType, themeType } from "@/utils/dropdownTypes";

export default function Page() {
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState<themeType>("Modern");
    const [room, setRoom] = useState<roomType>("Living Room");
    const [restoredImage, setRestoredImage] = useState("");

    async function generatePhoto(fileUrl: string) {
        setLoading(true);
        setRestoredImage("");  // Clear the old restored image
        const res = await fetch("/api/gen", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageUrl: fileUrl, theme, room }),
        });

        let newPhoto = await res.json();
        if (res.status !== 200) {
            setError(newPhoto);
        } else {
            setRestoredImage(newPhoto[1]);
        }
        setLoading(false);
    }

    return (
        <div className="max-w-3xl mx-auto p-4 items-center justify-center">
            <h1 className="text-2xl font-bold text-center mb-4">Upload and Remodel Your Image</h1>
            <UploadDropzone
                // appearance={{
                //     button: "bg-red-500 ut-button:ut-ready:bg-red-500/50",
                //     container:
                //       "bg-slate-800 ut-label:text-lg ut-label:text-white ut-allowed-content:ut-uploading:text-red-300",
                //   }}
                endpoint={"imageUploader"}
                onClientUploadComplete={(res) => {
                    if (res?.[0].url) {
                        console.log("Good job! We did it!", res?.[0].url);
                        setImageUrl(res?.[0].url);
                        generatePhoto(res?.[0].url);
                    }
                }}
                onUploadError={(error: Error) => {
                    console.error("Oops something is wrong", error);
                }}
            />

            {imageUrl && (
                <div className="mt-4 mx-auto">
                    <Image
                        alt="Uploaded"
                        // className="object-cover rounded-md"
                        src={imageUrl}
                        // layout="responsive"
                        width={500}
                        height={500}
                        className="object-contain rounded-md w-full h-auto"
                        // style={{ aspectRatio: 'auto' }}
                    />
                </div>
            )}

            {loading && (
                <div className="flex justify-center items-center mt-4">
                    <div className="text-center text-sm text-muted-foreground">
                        Processing your image...
                    </div>
                </div>
            )}

            {restoredImage && !loading && (
                <div className="text-center mt-4">
                    <div className="text-sm text-muted-foreground">
                        Here is your remodeled <b>{room.toLowerCase()}</b> in the <b>{theme.toLowerCase()}</b> theme!
                    </div>
                    <div className="relative mt-4 mx-auto">
                        <Image
                            alt="Restored Photo"
                            src={restoredImage}
                            // className="object-cover rounded-md"
                            // layout="responsive"
                            width={500}
                            height={500}
                            className="object-contain rounded-md w-full h-auto"
                            // style={{ aspectRatio: 'auto' }}
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="text-red-500 text-center mt-4">
                    {error}
                </div>
            )}
        </div>
    );
}
