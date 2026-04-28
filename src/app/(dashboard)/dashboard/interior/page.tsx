"use client";

import Image from "next/image";
import { useUploadThing } from "@/utils/uploadthing";
import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import DropDown from "@/app/(dashboard)/_components/DropDown";
import { roomType, rooms, themeType, themes, qualityType, qualities } from "@/utils/dropdownTypes";
import { uploadProcessedImage } from "@/utils/uploadProcessedImage";
import { CheckIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface PredictionState {
    id: string;
    status: "queued" | "succeeded" | "failed";
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
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Derived: true while any prediction is still queued
    const isGenerating = Object.values(predictions).some(p => p.status === "queued");

    // Keep predictions sorted by selectedThemes order
    const sortedPredictions = Object.values(predictions).sort((a, b) => {
        const ai = selectedThemes.indexOf(a.theme);
        const bi = selectedThemes.indexOf(b.theme);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

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

    async function generatePhoto(fileUrl: string, theme: themeType, room: roomType, origImageId: string | null) {
        try {
            const res = await fetch("/api/gen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: fileUrl, theme, room }),
            });

            const data = await res.json();

            if (res.status === 200 && data.restoredImage) {
                setPredictions(prev => {
                    const next = { ...prev };
                    Object.keys(next).forEach(key => {
                        if (key.startsWith('temp_') && next[key].theme === theme) delete next[key];
                    });
                    next[data.id] = { id: data.id, status: "succeeded", theme, resultUrl: data.restoredImage };
                    return next;
                });
                if (origImageId) runTest(data.restoredImage, origImageId);
            } else {
                const failedId = `failed_${theme}_${Date.now()}`;
                setError(data.error || `Failed to generate for ${theme}`);
                setPredictions(prev => {
                    const next = { ...prev };
                    Object.keys(next).forEach(key => {
                        if (key.startsWith('temp_') && next[key].theme === theme) delete next[key];
                    });
                    next[failedId] = { id: failedId, status: "failed", theme };
                    return next;
                });
            }
        } catch (err) {
            console.error(err);
            const failedId = `failed_${theme}_${Date.now()}`;
            setError(`Error generating photo for ${theme}`);
            setPredictions(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(key => {
                    if (key.startsWith('temp_') && next[key].theme === theme) delete next[key];
                });
                next[failedId] = { id: failedId, status: "failed", theme };
                return next;
            });
        }
    }

    const { startUpload } = useUploadThing("imageUploader", {
        onUploadBegin: () => setIsUploading(true),
        onClientUploadComplete: (res) => {
            setIsUploading(false);
            if (res?.[0].url) {
                const fileUrl = res[0].url;
                const origId = res[0].key;
                setImageUrl(fileUrl);
                setOriginalImageId(origId);
                selectedThemes.forEach(theme => generatePhoto(fileUrl, theme, room, origId));
            }
        },
        onUploadError: () => {
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
        setImageUrl(null);
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

        const initialPredictions: Record<string, PredictionState> = {};
        selectedThemes.forEach(theme => {
            const tempId = `temp_${theme}_${Date.now()}`;
            initialPredictions[tempId] = { id: tempId, status: "queued", theme };
        });
        setPredictions(initialPredictions);

        if (imageUrl) {
            selectedThemes.forEach(theme => generatePhoto(imageUrl, theme, room, originalImageId));
        } else if (selectedFile) {
            await startUpload([selectedFile], { design: 'interior', type: 'original' });
        }
    }, [selectedFile, imageUrl, selectedThemes, startUpload, room, originalImageId]);

    const clearImage = () => {
        setImageUrl(null);
        setSelectedFile(null);
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setPredictions({});
    };

    const downloadImage = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed:", error);
            window.open(url, '_blank');
        }
    };

    return (
        <>
        {/* Image modal */}
        {modalImage && (
            <div
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                onClick={() => setModalImage(null)}
            >
                <img
                    src={modalImage}
                    alt="Full size"
                    className="max-w-full max-h-full object-contain rounded-2xl"
                    onClick={e => e.stopPropagation()}
                />
                <button
                    onClick={() => setModalImage(null)}
                    className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl font-light leading-none"
                >✕</button>
            </div>
        )}

        <div className="max-w-[1600px] mx-auto p-4 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start h-full">

                {/* Sidebar */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-8 lg:sticky lg:top-4 px-2">

                    {/* 1. Upload */}
                    <section className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">1. Original Room</label>
                        {!imageUrl && !previewUrl ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="group cursor-pointer flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-gray-200 py-12 transition-all hover:border-gray-900 hover:bg-white"
                            >
                                <ArrowUpTrayIcon className="w-8 h-8 text-gray-300 group-hover:text-gray-900 transition-colors" />
                                <p className="mt-3 text-[10px] font-black text-gray-400 uppercase">Click to upload</p>
                                <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleFileSelect} />
                            </div>
                        ) : (
                            <div className="relative group rounded-[2rem] overflow-hidden ring-1 ring-gray-100 aspect-[4/3] w-full">
                                <Image src={previewUrl || imageUrl || ""} alt="Preview" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-white uppercase border border-white/50 px-6 py-2.5 rounded-2xl backdrop-blur-md hover:bg-white hover:text-black transition-all">Change Photo</button>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleFileSelect} />
                            </div>
                        )}
                    </section>

                    {/* 2. Room Type */}
                    <section className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">2. Room Type</label>
                        <DropDown
                            theme={room}
                            setTheme={(newRoom) => startTransition(() => setRoom(newRoom as roomType))}
                            themes={rooms}
                        />
                    </section>

                    {/* 3. Themes */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">3. Style Themes</label>
                            <span className="text-[10px] font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-full">{selectedThemes.length}/4</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {themes.map((t) => (
                                <div
                                    key={t.name}
                                    onClick={() => toggleTheme(t.name)}
                                    className={clsx(
                                        "relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-200",
                                        selectedThemes.includes(t.name) ? "border-gray-900 scale-105" : "border-transparent ring-1 ring-gray-100 hover:ring-gray-300"
                                    )}
                                >
                                    <Image src={t.image} alt={t.name} fill sizes="(max-width: 768px) 33vw, 10vw" className="object-cover" />
                                    {selectedThemes.includes(t.name) && (
                                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                            <div className="bg-white rounded-full p-1.5 scale-110">
                                                <CheckIcon className="w-3 h-3 text-gray-900" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Quality + Render */}
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                        <section className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Render Quality</label>
                            <DropDown
                                theme={quality}
                                setTheme={(newQuality) => startTransition(() => setQuality(newQuality as qualityType))}
                                themes={qualities}
                            />
                        </section>

                        <button
                            onClick={handleUpload}
                            disabled={isUploading || isGenerating || (!selectedFile && !imageUrl)}
                            className="w-full py-5 bg-gray-900 text-white text-base font-black rounded-[2rem] hover:bg-black transition-all transform active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-3"
                        >
                            {isUploading || isGenerating ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="uppercase tracking-[0.2em] text-xs">Start Rendering</span>
                            )}
                        </button>

                        <div className="flex items-center justify-between px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span>Credits Required</span>
                            <span className="text-gray-900 font-black">{selectedThemes.length * (quality === "Pro - 2 credits" ? 2 : 1)} Units</span>
                        </div>
                    </div>

                    {error && (
                        <p className="text-[10px] font-black text-red-500 text-center uppercase tracking-tighter bg-red-50 py-3 rounded-2xl border border-red-100">{error}</p>
                    )}
                </div>

                {/* Canvas */}
                <div className="lg:col-span-8 xl:col-span-9 pb-20">
                    <div className="space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-8 px-2">
                            <div className="space-y-1">
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Canvas</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Architectural Visualization Workspace</p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Generation Progress</span>
                                    <span className="text-xs font-black text-gray-900">
                                        {sortedPredictions.filter(p => p.status === 'succeeded').length} / {selectedThemes.length}
                                    </span>
                                </div>
                                <div className="w-64 h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-900 transition-all duration-700 ease-out" style={{ width: `${(sortedPredictions.filter(p => p.status === 'succeeded').length / Math.max(selectedThemes.length, 1)) * 100}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-2">
                            {/* Predictions in theme order */}
                            {sortedPredictions.map((p) => (
                                <div key={p.id} className="group space-y-4">
                                    <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-white border border-gray-100">
                                        {p.status === "queued" ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
                                                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-5 animate-pulse">
                                                    <div className="w-7 h-7 bg-gray-200 rounded-full" />
                                                </div>
                                                <p className="text-xs font-black text-gray-700 uppercase tracking-widest">Rendering...</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{p.theme}</p>
                                            </div>
                                        ) : p.status === "succeeded" && p.resultUrl ? (
                                            <img
                                                src={p.resultUrl}
                                                alt={p.theme}
                                                className="absolute inset-0 w-full h-full object-cover cursor-zoom-in"
                                                onClick={() => setModalImage(p.resultUrl!)}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center p-6">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Generation failed. Please try again.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between px-2">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{p.theme}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{room} • AI Generated</p>
                                        </div>
                                        {p.status === "succeeded" && p.resultUrl && (
                                            <button
                                                onClick={() => downloadImage(p.resultUrl!, `${p.theme}-${room}.jpg`)}
                                                className="bg-gray-900 text-white p-2.5 rounded-xl transition-all hover:bg-gray-700 active:scale-90"
                                                title="Download"
                                            >
                                                <ArrowUpTrayIcon className="w-4 h-4 -rotate-180" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Draft slots */}
                            {selectedThemes
                                .filter(themeName => !sortedPredictions.some(p => p.theme === themeName))
                                .map((themeName) => (
                                    <div key={themeName} className="space-y-4 opacity-50">
                                        <div className="relative aspect-square rounded-[2rem] border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                                            <div className="text-center space-y-2">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto flex items-center justify-center border border-gray-200">
                                                    <Image src={themes.find(t => t.name === themeName)?.image || ""} alt="Draft" width={24} height={24} className="opacity-40 grayscale rounded-lg" />
                                                </div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ready to Render</p>
                                            </div>
                                        </div>
                                        <div className="px-2 space-y-0.5">
                                            <p className="text-sm font-black text-gray-400 uppercase tracking-tight">{themeName}</p>
                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{room} • Pending</p>
                                        </div>
                                    </div>
                                ))}

                            {/* Empty state */}
                            {selectedThemes.length === 0 && Object.keys(predictions).length === 0 && (
                                <div className="col-span-full h-[60vh] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-gray-100 text-center">
                                    <div className="relative w-48 h-48 mb-8">
                                        <Image src="/images/demo-industrial.png" alt="Workspace" fill sizes="192px" className="object-contain" />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">Studio Canvas</h3>
                                        <div className="w-10 h-0.5 bg-gray-900 mx-auto" />
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest max-w-xs mx-auto">Select style themes from the sidebar to populate your workspace.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
