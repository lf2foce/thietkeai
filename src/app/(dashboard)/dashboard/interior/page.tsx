"use client";

import Image from "next/image";
import { useUploadThing } from "@/utils/uploadthing";
import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import DropDown from "@/app/(dashboard)/_components/DropDown";
import { roomType, rooms, themeType, themes, qualityType, qualities } from "@/utils/dropdownTypes";
import { uploadProcessedImage } from "@/utils/uploadProcessedImage";
import { CheckIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface PredictionState {
    id: string;
    status: "processing" | "succeeded" | "failed";
    theme: themeType;
    resultUrl?: string;
}

export default function Page() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [originalImageId, setOriginalImageId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [room, setRoom] = useState<roomType>("Living Room");
    const [quality, setQuality] = useState<qualityType>("Pro - 2 credits");
    const [selectedThemes, setSelectedThemes] = useState<themeType[]>(["Modern"]);
    const [predictions, setPredictions] = useState<Record<string, PredictionState>>({});
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Polling for multiple predictions
    useEffect(() => {
        const activePredictions = Object.values(predictions).filter(p => p.status === "processing");
        
        if (activePredictions.length > 0) {
            const pollInterval = setInterval(() => {
                activePredictions.forEach(p => checkPredictionStatus(p.id, p.theme));
            }, 1500);

            return () => clearInterval(pollInterval);
        } else if (Object.keys(predictions).length > 0 && activePredictions.length === 0) {
            setIsGenerating(false);
        }
    }, [predictions]);

    // Cleanup object URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const toggleTheme = useCallback((theme: themeType) => {
        startTransition(() => {
            setSelectedThemes((prev) => {
                if (prev.includes(theme)) {
                    return prev.filter((t) => t !== theme);
                } else if (prev.length < 4) {
                    return [...prev, theme];
                }
                return prev;
            });
        });
    }, []);

    async function runTest(imageUrl: string, originalImageId: string) {
        if (originalImageId) {
            try {
                await uploadProcessedImage(imageUrl, originalImageId);
            } catch (error) {
                console.error("Failed to upload processed image:", error);
            }
        }
    }

    async function generatePhoto(fileUrl: string, theme: themeType, room: roomType) {
        try {
            const res = await fetch("/api/gen", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ imageUrl: fileUrl, theme, room }),
            });

            const data = await res.json();
            if (res.status === 200) {
                setPredictions(prev => ({
                    ...prev,
                    [data.id]: { id: data.id, status: "processing", theme }
                }));
            } else {
                setError(data.error || `Failed to start generation for ${theme}`);
            }
        } catch (err) {
            console.error(err);
            setError(`Error generating photo for ${theme}`);
        }
    }

    async function checkPredictionStatus(id: string, theme: themeType) {
        try {
            const res = await fetch(`/api/gen?id=${id}`);
            const data = await res.json();

            if (data.status === "succeeded") {
                const resultUrl = Array.isArray(data.restoredImage) ? data.restoredImage[0] : data.restoredImage;
                
                setPredictions(prev => ({
                    ...prev,
                    [id]: { ...prev[id], status: "succeeded", resultUrl }
                }));

                if (resultUrl && originalImageId) {
                    runTest(resultUrl, originalImageId);
                }
            } else if (data.status === "failed") {
                setPredictions(prev => ({
                    ...prev,
                    [id]: { ...prev[id], status: "failed" }
                }));
                setError(`Generation failed for ${theme}`);
            }
        } catch (err) {
            console.error("Error in checkPredictionStatus:", err);
        }
    }

    const { startUpload } = useUploadThing("imageUploader", {
        onUploadBegin: () => setIsUploading(true),
        onClientUploadComplete: (res) => {
            setIsUploading(false);
            if (res?.[0].url) {
                const fileUrl = res[0].url;
                setImageUrl(fileUrl);
                setOriginalImageId(res[0].key);
                
                // Trigger generations for all selected themes
                setIsGenerating(true);
                selectedThemes.forEach(theme => {
                    generatePhoto(fileUrl, theme, room);
                });
            }
        },
        onUploadError: (err) => {
            setIsUploading(false);
            setError("Upload failed. Please try again.");
        },
    });

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        // Reset predictions when new file is selected
        setPredictions({});
    }, [previewUrl]);

    const handleUpload = useCallback(async () => {
        if (!selectedFile) {
            setError("Please select an image first.");
            return;
        }
        if (selectedThemes.length === 0) {
            setError("Please select at least one theme.");
            return;
        }
        setError(null);
        setPredictions({}); // Clear previous results
        await startUpload([selectedFile], { design: 'interior', type: 'original' });
    }, [selectedFile, selectedThemes, startUpload]);

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                {/* Left Column: Parameters (1/3) */}
                <div className="space-y-10 lg:sticky lg:top-8">
                    {/* Step 1: Room Type */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900">(1) Select Room Type</h2>
                        <DropDown
                            theme={room}
                            setTheme={(newRoom) => startTransition(() => setRoom(newRoom as roomType))}
                            themes={rooms}
                        />
                    </section>

                    {/* Step 2: Quality */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900">(2) Select Quality</h2>
                        <DropDown
                            theme={quality}
                            setTheme={(newQuality) => startTransition(() => setQuality(newQuality as qualityType))}
                            themes={qualities}
                        />
                    </section>

                    {/* Step 3: Room Themes */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900">(3) Select Room Themes (up to 4)</h2>
                        <div className={clsx("grid grid-cols-3 gap-3 transition-opacity duration-200", isPending && "opacity-70")}>
                            {themes.map((t) => (
                                <div 
                                    key={t.name}
                                    onClick={() => toggleTheme(t.name)}
                                    className="group cursor-pointer space-y-1.5"
                                >
                                    <div className={clsx(
                                        "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200",
                                        selectedThemes.includes(t.name) ? "border-blue-500 scale-105 shadow-md" : "border-transparent group-hover:border-gray-200"
                                    )}>
                                        <Image 
                                            src={t.image} 
                                            alt={t.name}
                                            fill
                                            sizes="(max-width: 768px) 33vw, 10vw"
                                            className="object-cover"
                                        />
                                        {selectedThemes.includes(t.name) && (
                                            <div className="absolute top-1.5 right-1.5 bg-blue-500 rounded-full p-0.5">
                                                <CheckIcon className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <p className={clsx(
                                        "text-[10px] sm:text-xs font-bold text-center transition-colors uppercase tracking-tight",
                                        selectedThemes.includes(t.name) ? "text-blue-600" : "text-gray-500"
                                    )}>
                                        {t.name}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: Upload & Results (2/3) */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Step 4: Upload & Render */}
                    <section className="space-y-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900">(4) Upload & Render</h2>
                        <div className="space-y-6">
                            <div className="relative group">
                                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 px-6 py-12 text-center transition-all hover:border-blue-400 hover:bg-blue-50/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-gray-300 group-hover:text-blue-400 transition-colors">
                                        <path fillRule="evenodd" d="M10.5 3.75a6 6 0 00-5.98 6.496A5.25 5.25 0 006.75 20.25H18a4.5 4.5 0 001.106-8.865 6 6 0 00-8.606-7.635zM12 8.25a.75.75 0 01.75.75v4.59l1.22-1.22a.75.75 0 111.06 1.06l-2.5 2.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 111.06-1.06l1.22 1.22V9a.75.75 0 01.75-.75z" clipRule="evenodd" />
                                    </svg>
                                    <label className="mt-4 cursor-pointer">
                                        <span className="text-xl font-bold text-gray-900 block">
                                            {selectedFile ? selectedFile.name : "Choose a file or drag and drop"}
                                        </span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={handleFileSelect}
                                        />
                                    </label>
                                    <p className="mt-1 text-sm text-gray-400">Image (max 4MB)</p>
                                    
                                    {previewUrl && (
                                        <div className="mt-8 relative w-48 h-48 rounded-2xl overflow-hidden ring-4 ring-blue-500 ring-offset-4 shadow-2xl">
                                            <Image 
                                                src={previewUrl} 
                                                alt="Preview" 
                                                fill 
                                                className="object-cover" 
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading || isGenerating || !selectedFile}
                                    className="w-full sm:w-auto px-10 py-4 bg-[#e12d2d] text-white text-xl font-black rounded-2xl hover:bg-[#c12525] transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-red-200"
                                >
                                    {isUploading ? "Uploading..." : isGenerating ? "Generating..." : "Render designs"}
                                </button>
                                <div className="text-lg font-bold text-gray-600 flex items-center gap-2">
                                    <span>Cost:</span>
                                    <span className="bg-gray-100 px-3 py-1 rounded-lg text-gray-900">
                                        {selectedThemes.length > 0 ? selectedThemes.length * 2 : 2} credits
                                    </span>
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-500 font-bold text-center">{error}</p>
                            )}
                        </div>
                    </section>

                    {/* Results Section */}
                    {(Object.keys(predictions).length > 0 || imageUrl) && (
                        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-gray-900">Generated Results</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {Object.values(predictions).map((p) => (
                                    <div key={p.id} className="space-y-4">
                                        <div className="relative aspect-[16/10] rounded-[2rem] overflow-hidden shadow-xl ring-1 ring-gray-100 bg-gray-50">
                                            {p.status === "processing" ? (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-sm font-bold text-gray-500 animate-pulse">Rendering {p.theme}...</p>
                                                </div>
                                            ) : p.status === "succeeded" && p.resultUrl ? (
                                                <>
                                                    <Image 
                                                        src={p.resultUrl} 
                                                        alt={`${p.theme} result`} 
                                                        fill 
                                                        className="object-cover" 
                                                    />
                                                    <button 
                                                        onClick={() => window.open(p.resultUrl, '_blank')}
                                                        className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-white transition-colors"
                                                    >
                                                        Download
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <p className="text-red-500 font-bold">Failed to generate</p>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-center text-gray-600 font-bold uppercase tracking-wider text-xs">
                                            {p.theme} {room}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {imageUrl && (
                                <div className="pt-12 border-t border-gray-100">
                                    <div className="max-w-md mx-auto w-full space-y-4 opacity-40 hover:opacity-100 transition-opacity">
                                        <p className="text-xs font-bold text-gray-400 text-center uppercase tracking-widest">Original Reference</p>
                                        <div className="relative aspect-[16/10] rounded-3xl overflow-hidden shadow-md border border-gray-100">
                                            <Image 
                                                src={imageUrl} 
                                                alt="Original" 
                                                fill 
                                                sizes="(max-width: 768px) 100vw, 500px"
                                                className="object-cover" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

