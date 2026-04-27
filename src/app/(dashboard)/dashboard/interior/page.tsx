"use client";

import Image from "next/image";
import { useUploadThing } from "@/utils/uploadthing";
import { useState, useEffect, useRef } from "react";
import DropDown from "@/app/(dashboard)/_components/DropDown";
import { roomType, rooms, themeType, themes } from "@/utils/dropdownTypes";
import { uploadProcessedImage } from "@/utils/uploadProcessedImage";

export const dynamic = "force-dynamic";
export const maxDuration = 60; 

export default function Page() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    const { startUpload } = useUploadThing("imageUploader", {
        onUploadBegin: () => setIsUploading(true),
        onClientUploadComplete: (res) => {
            setIsUploading(false);
            if (res?.[0].url) {
                setImageUrl(res[0].url);
                setOriginalImageId(res[0].key);
                generatePhoto(res[0].url, theme, room);
            }
        },
        onUploadError: (err) => {
            setIsUploading(false);
            setError("Upload failed. Please try again.");
        },
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        await startUpload([selectedFile], { design: 'interior', type: 'original' });
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
                    <div className="mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-8 text-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="mx-auto h-12 w-12 text-gray-400">
                            <path fill="currentColor" fillRule="evenodd" d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765a4.5 4.5 0 0 1 8.302-3.046a3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z" clipRule="evenodd" />
                        </svg>
                        <label className="cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-500">
                            {selectedFile ? selectedFile.name : "Choose a file or drag and drop"}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={handleFileSelect}
                            />
                        </label>
                        <p className="text-xs text-gray-600">Image (4MB)</p>
                        {previewUrl && (
                            <img src={previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-md" />
                        )}
                        {selectedFile && (
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? "Uploading..." : `Upload ${selectedFile.name}`}
                            </button>
                        )}
                    </div>
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