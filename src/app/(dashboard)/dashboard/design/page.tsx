"use client";

import Image from "next/image";
import { UploadDropzone } from "@/utils/uploadthing";
import { useState } from "react";
import DropDown from "@/app/(dashboard)/_components/DropDown";
import { roomType, rooms, themeType, themes } from "@/utils/dropdownTypes";
// import styled from 'styled-components';
import RoomThemes from '@/app/(dashboard)/_components/RoomThemes';


export const dynamic = "force-dynamic";
export const maxDuration = 60; // This function can run for a maximum of 5 seconds


export default function Page() {
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState<themeType>("Modern");
    const [room, setRoom] = useState<roomType>("Living Room");
    const [restoredImage, setRestoredImage] = useState("");

    //TA test
   //

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
            setError(newPhoto.error);
        } else {
            setRestoredImage(newPhoto.restoredImage);
        }
        setLoading(false);
    }

    return (
        <div className="mx-auto p-4 items-center justify-center">
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-4 lg:col-span-1">
                    <div className="space-y-4 w-full">
                        <p className="text-left font-medium">(1) Choose your room type.</p>
                        <DropDown
                          theme={room}
                          setTheme={(newRoom) => setRoom(newRoom as typeof room)}
                          themes={rooms}
                        />
                         <p className="text-left font-medium">(2) Choose your room theme.</p>
                        <DropDown
                          theme={theme}
                          setTheme={(newTheme) => setTheme(newTheme as typeof theme)}
                          themes={themes}
                        />
                        {/* <RoomThemes /> */}
                     
                    </div>
                    <p className="text-left font-medium mt-4">(3) Upload your photo.</p>
                    <UploadDropzone
                        appearance={{
                            container: {
                                margin: "5px",
                                padding: "10px",
                            },
                        }}
                        endpoint={"imageUploader"}
                        onClientUploadComplete={(res) => {
                            if (res?.[0].url) {
                                setImageUrl(res?.[0].url);
                                generatePhoto(res?.[0].url, theme, room);
                            }
                        }}
                        onUploadError={(error: Error) => {
                            console.error("Oops something is wrong", error);
                        }}
                    />
                </div>
                <div className="col-span-4 lg:col-span-2">
                    {imageUrl && (
                        <div className="mt-4 mx-auto">
                            <Image
                                alt="Uploaded"
                                src={imageUrl}
                                width={500}
                                height={500}
                                className="object-contain rounded-md w-full h-auto"
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
                                    width={500}
                                    height={500}
                                    className="object-contain rounded-md w-full h-auto"
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
