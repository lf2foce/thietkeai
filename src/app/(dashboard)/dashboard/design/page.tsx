"use client";

import Image from "next/image";
import { UploadDropzone } from "@/utils/uploadthing";
import { useState, useEffect } from "react";
import DropDown from "@/app/(dashboard)/_components/DropDown";
import { roomType, rooms, themeType, themes } from "@/utils/dropdownTypes";
// import styled from 'styled-components';
import RoomThemes from '@/app/(dashboard)/_components/RoomThemes';


export const dynamic = "force-dynamic";
export const maxDuration = 60; 


export default function Page() {
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState<themeType>("Modern");
    const [room, setRoom] = useState<roomType>("Living Room");
    const [restoredImage, setRestoredImage] = useState("");
    const [predictionId, setPredictionId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (predictionId) {
            const pollInterval = setInterval(() => {
                checkPredictionStatus(predictionId);
            }, 1000);

            return () => clearInterval(pollInterval);
        }
    }, [predictionId]);

    async function generatePhoto(fileUrl: string, theme: themeType, room: roomType) {
        setIsGenerating(true);
        setRestoredImage("");
        setError(null);
        setPredictionId(null);

        try {
            const res = await fetch("/api/gen", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ imageUrl: fileUrl, theme, room }),
            });

            const data = await res.json();
            if (res.status !== 200) {
                setError(data.error || "An error occurred while generating the photo.");
                setIsGenerating(false);
            } else {
                setPredictionId(data.id);
            }
        } catch (err) {
            setError("An error occurred while generating the photo.");
            setIsGenerating(false);
        }
    }

    async function checkPredictionStatus(id: string) {
        try {
            const res = await fetch(`/api/gen?id=${id}`);
            const data = await res.json();
            console.log("Prediction status response:", data);

            if (data.status === "succeeded") {
                console.log("Restored image URL:", data.restoredImage);
                // Check if restoredImage is an array and take the first item if so
                const imageUrl = Array.isArray(data.restoredImage) ? data.restoredImage[0] : data.restoredImage;
                setRestoredImage(imageUrl);
                setIsGenerating(false);
                setPredictionId(null);
            } else if (data.status === "failed") {
                setError("Image generation failed. Please try again.");
                setIsGenerating(false);
                setPredictionId(null);
            } else if (data.status === "processing") {
                console.log("Still processing...");
            } else {
                console.log("Unexpected status:", data.status);
                setError("Unexpected status received from the server.");
                setIsGenerating(false);
                setPredictionId(null);
            }
        } catch (err) {
            console.error("Error in checkPredictionStatus:", err);
            setError("An error occurred while checking the prediction status.");
            setIsGenerating(false);
            setPredictionId(null);
        }
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
                        onUploadBegin={() => {
                            setIsUploading(true);
                        }}
                        onClientUploadComplete={(res) => {
                            setIsUploading(false);
                            if (res?.[0].url) {
                                setImageUrl(res?.[0].url);
                                generatePhoto(res?.[0].url, theme, room);
                            }
                        }}
                        onUploadError={(error: Error) => {
                            setIsUploading(false);
                            console.error("Oops something is wrong", error);
                            setError("Upload failed. Please try again.");
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

                    {isUploading && (
                        <div className="flex justify-center items-center mt-4">
                            <div className="text-center text-sm text-muted-foreground">
                                Uploading your image...
                            </div>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="flex justify-center items-center mt-4">
                            <div className="text-center text-sm text-muted-foreground">
                                Processing your image...
                            </div>
                        </div>
                    )}
                    
                    {restoredImage && !isGenerating && (
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

                    {/* {restoredImage && (
                        <div>
                            <p>Debug: Restored Image URL: {restoredImage}</p>
                        </div>
                    )} */}
                </div>
            </div>
        </div>
    );
}
