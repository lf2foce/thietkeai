"use client";

import Image from "next/image";
import { UploadDropzone } from "@/utils/uploadthing";
import { useState } from "react";
import DropDown from "@/app/(dashboard)/_components/DropDown";
import { roomType, rooms, themeType, themes } from "@/utils/dropdownTypes";

export default function Page() {
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState<themeType>("Modern");
    const [room, setRoom] = useState<roomType>("Living Room");
    const [restoredImage, setRestoredImage] = useState("");

    async function generatePhoto(fileUrl: string, theme: themeType, room: roomType) {
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
        <div className="mx-auto p-4 items-center justify-center">
            <div className="grid grid-cols-3 gap-6 ">
            <div className="col-span-4 lg:col-span-1">
            {/* <h1 className="text-xl font-bold text-center mb-4">Upload a photo of your room</h1> */}
            

                <div className="space-y-4 w-full ">
                    
            

                    <p className="text-left font-medium">
                        (1)Choose your room type.
                    </p>
                    
                    <DropDown
                      theme={room}
                      setTheme={(newRoom) => setRoom(newRoom as typeof room)}
                      themes={rooms}
                    />

                    <p className="text-left font-medium">
                        (2)Choose your room theme.
                    </p>
                    <DropDown
                      theme={theme}
                      setTheme={(newTheme) =>
                        setTheme(newTheme as typeof theme)
                      }
                      themes={themes}
                    />
            
                </div>
                <p className="text-left font-medium mt-4">
                        (3)Upload your photo.
                    </p>
                    <UploadDropzone
                    appearance={{
                        // button: "bg-red-500 ut-button:ut-ready:bg-red-500/50",
                        container: {
                            margin: "5px",
                            padding: "10px",
                        },
                        // container:
                        //   "bg-slate-800 ut-label:text-lg ut-label:text-white ut-allowed-content:ut-uploading:text-red-300",
                    }}
                    endpoint={"imageUploader"}
                    onClientUploadComplete={(res) => {
                        if (res?.[0].url) {
                            console.log("Good job! We did it!", res?.[0].url);
                            setImageUrl(res?.[0].url);
                            generatePhoto(res?.[0].url, theme, room);
                            console.log(res?.[0].url, theme, room);
                        }
                    }}
                    onUploadError={(error: Error) => {
                        console.error("Oops something is wrong", error);
                    }}
                />
            </div>
            <div className="col-span-4 lg:col-span-2 ">
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
                    {restoredImage}
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
        </div>
        </div>
    );
}
