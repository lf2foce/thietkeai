"use client";

import Image from "next/image";
import { useUploadThing } from "@/utils/uploadthing";
import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import DropDown from "@/app/(dashboard)/_components/DropDown";
import { roomType, rooms, themeType, themes, qualityType, qualities } from "@/utils/dropdownTypes";
import { uploadProcessedImage } from "@/utils/uploadProcessedImage";
import { CheckIcon, TrashIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
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
        setImageUrl(null); // Reset uploaded URL when new file selected
        setPredictions({});
    }, [previewUrl]);

    const handleUpload = useCallback(async () => {
        if (!selectedFile && !imageUrl) {
            setError("Please select an image first.");
            return;
        }
        if (selectedThemes.length === 0) {
            setError("Please select at least one theme.");
            return;
        }
        
        setError(null);
        setPredictions({}); // Clear previous results

        if (imageUrl) {
            // Skip upload, just generate
            setIsGenerating(true);
            selectedThemes.forEach(theme => {
                generatePhoto(imageUrl, theme, room);
            });
        } else if (selectedFile) {
            // Need to upload
            await startUpload([selectedFile], { design: 'interior', type: 'original' });
        }
    }, [selectedFile, imageUrl, selectedThemes, startUpload, room]);

    const clearImage = () => {
        setImageUrl(null);
        setSelectedFile(null);
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setPredictions({});
    };

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
                    <section className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">(4) Upload & Render</h2>
                            {imageUrl && (
                                <button 
                                    onClick={clearImage}
                                    className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-bold transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    Clear All
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-8">
                            {/* Upload Area */}
                            <div className={clsx(
                                "flex-1 w-full transition-all duration-300",
                                (imageUrl || previewUrl) ? "max-w-[300px]" : "w-full"
                            )}>
                                {!imageUrl && !previewUrl ? (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="group cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center transition-all hover:border-blue-400 hover:bg-blue-50/30"
                                    >
                                        <ArrowUpTrayIcon className="w-10 h-10 text-gray-300 group-hover:text-blue-400 transition-colors" />
                                        <p className="mt-3 text-sm font-bold text-gray-900">Upload a photo</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Image (max 4MB)</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={handleFileSelect}
                                        />
                                    </div>
                                ) : (
                                    <div className="relative group rounded-2xl overflow-hidden ring-1 ring-gray-100 shadow-lg aspect-square w-full">
                                        <Image 
                                            src={previewUrl || imageUrl || ""} 
                                            alt="Preview" 
                                            fill 
                                            className="object-cover" 
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="bg-white text-gray-900 px-4 py-2 rounded-full text-xs font-black shadow-xl"
                                            >
                                                Change Photo
                                            </button>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={handleFileSelect}
                                        />
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                                            <p className="text-[10px] font-black text-gray-900 uppercase">Original Room</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Render Button Section */}
                            <div className="flex-1 w-full space-y-4">
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading || isGenerating || (!selectedFile && !imageUrl)}
                                    className="w-full py-4 bg-[#e12d2d] text-white text-xl font-black rounded-2xl hover:bg-[#c12525] transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-red-100 flex items-center justify-center gap-3"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Uploading...</span>
                                        </>
                                    ) : isGenerating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <span>Render designs</span>
                                    )}
                                </button>
                                
                                <div className="flex items-center justify-between px-2">
                                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                        Estimated Cost
                                    </div>
                                    <div className="bg-gray-50 px-4 py-1.5 rounded-xl border border-gray-100 text-gray-900 font-black text-sm">
                                        {selectedThemes.length > 0 ? selectedThemes.length * 2 : 2} credits
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-red-500 font-bold text-center text-sm animate-shake">{error}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Results Section */}
                    {(Object.keys(predictions).length > 0) && (
                        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                                <h2 className="text-2xl font-black text-gray-900">Generated Results</h2>
                                <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                                    {Object.values(predictions).filter(p => p.status === 'succeeded').length} / {Object.keys(predictions).length} Completed
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {Object.values(predictions).map((p) => (
                                    <div key={p.id} className="group space-y-4">
                                        <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-gray-100 bg-gray-50 transition-transform duration-500 hover:scale-[1.02]">
                                            {p.status === "processing" ? (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-inner"></div>
                                                    <p className="text-sm font-black text-gray-400 animate-pulse uppercase tracking-widest">Rendering {p.theme}...</p>
                                                </div>
                                            ) : p.status === "succeeded" && p.resultUrl ? (
                                                <>
                                                    <Image 
                                                        src={p.resultUrl} 
                                                        alt={`${p.theme} result`} 
                                                        fill 
                                                        className="object-cover" 
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-6">
                                                        <button 
                                                            onClick={() => window.open(p.resultUrl, '_blank')}
                                                            className="bg-white/95 backdrop-blur-md text-gray-900 px-6 py-3 rounded-2xl text-xs font-black shadow-2xl hover:scale-105 transition-transform"
                                                        >
                                                            Download High-Res
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <p className="text-red-500 font-bold uppercase tracking-widest text-xs">Generation failed</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-gray-900 font-black uppercase tracking-tight text-sm">
                                                {p.theme} {room}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                AI Generated Concept
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

