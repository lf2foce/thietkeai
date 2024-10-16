"use client";

import Image from "next/image";
import { UploadDropzone } from "@/utils/uploadthing";
import { useState, useEffect } from "react";
import DropDown from "@/app/(dashboard)/_components/DropDown";
import { roomType, rooms, themeType, themes } from "@/utils/dropdownTypes";
import { uploadProcessedImage } from "@/utils/uploadProcessedImage";

export const dynamic = "force-dynamic";
export const maxDuration = 60; 

export default function Page() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [originalImageId, setOriginalImageId] = useState<string | null>(null);
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

    async function runTest(imageUrl: string, originalImageId: string) {
        setError(null);

        if (originalImageId) {
            // console.log("Attempting to upload processed image. URL:", imageUrl);
            try {
                const processedUrl = await uploadProcessedImage(imageUrl, originalImageId);
                // console.log('Processed image uploaded successfully: from processed image to', processedUrl);
            } catch (error) {
                console.error("Failed to upload processed image:", error);
                setError("Failed to save the processed image. Please try again. Error: " + (error instanceof Error ? error.message : String(error)));
            }
        } else {
            console.log("Not uploading processed image. originalImageId:", originalImageId);
        }
    }

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
            // console.log("Prediction status response:", data);

            if (data.status === "succeeded") {
                const imageUrl = Array.isArray(data.restoredImage) ? data.restoredImage[0] : data.restoredImage;
                setRestoredImage(imageUrl);
                setIsGenerating(false);
                setPredictionId(null);

                // Keep the preview URL as the processed image URL
                setPreviewUrl(imageUrl);

                if (imageUrl && originalImageId) {
                    runTest(imageUrl, originalImageId);
                } else {
                    console.log("Not uploading processed image. originalImageId is missing.");
                }
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

    const handleFileChange = (files: File[]) => {
        if (files.length > 0) {
            const file = files[0];
            setPreviewUrl(URL.createObjectURL(file)); // Create a preview URL
        }
    };

    return (
        <div className="mx-auto p-4 items-center justify-center">
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-4 lg:col-span-1">
                    <div className="space-y-4 w-full">
                        <p className="text-left font-medium">(1) Choose your room type.</p>
                        <DropDown
                          theme={room}
                          setTheme={(newRoom) => setRoom(newRoom as roomType)}
                          themes={rooms}
                        />
                        <p className="text-left font-medium">(2) Choose your room theme.</p>
                        <DropDown
                          theme={theme}
                          setTheme={(newTheme) => setTheme(newTheme as themeType)}
                          themes={themes}
                        />
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
                                const newImageUrl = res[0].url;
                                const newOriginalImageId = res[0].key;
                                
                                setImageUrl(newImageUrl);
                                setOriginalImageId(newOriginalImageId);
                                generatePhoto(newImageUrl, theme, room);
                            }
                        }}
                        onUploadError={(error: Error) => {
                            setIsUploading(false);
                            console.error("Oops something is wrong", error);
                            setError("Upload failed. Please try again.");
                        }}
                        input={{ design: 'interior', type: 'original' }}
                        onDrop={handleFileChange}
                    />
                    {previewUrl && (
                        <div className="mt-4">
                            <Image
                                src={previewUrl}
                                alt="Preview"
                                width={100} // Set the desired width
                                height={100} // Set the desired height
                                className="object-cover rounded-md"
                            />
                        </div>
                    )}
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
                </div>
            </div>
        </div>
    );
}