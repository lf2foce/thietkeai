"use client";

import Image from "next/image";
import { useUploadThing } from "@/utils/uploadthing";
import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import DropDown from "@/app/(dashboard)/_components/DropDown";
import { roomType, rooms, themeType, themes, qualityType, qualities } from "@/utils/dropdownTypes";
import { uploadProcessedImage } from "@/utils/uploadProcessedImage";
import { CheckIcon, ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";
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
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [originalImageId, setOriginalImageId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [room, setRoom] = useState<roomType>("Living Room");
    const [quality, setQuality] = useState<qualityType>("Pro - 2 credits");
    const [selectedThemes, setSelectedThemes] = useState<themeType[]>(["Modern"]);
    const [roomCondition, setRoomCondition] = useState<"raw" | "finished">("raw");
    const [renderMode, setRenderMode] = useState<"standard" | "style-ref">("standard");
    const [predictions, setPredictions] = useState<Record<string, PredictionState>>({});
    const [isUploading, setIsUploading] = useState(false);
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [customPrompt, setCustomPrompt] = useState("");
    const [isPending, startTransition] = useTransition();

    // Derived: true while any prediction is still queued
    const isGenerating = Object.values(predictions).some(p => p.status === "queued");

    // Keep predictions sorted by selectedThemes order
    const sortedPredictions = Object.values(predictions).sort((a, b) => {
        if (renderMode === 'style-ref') return 0;
        const ai = selectedThemes.indexOf(a.theme);
        const bi = selectedThemes.indexOf(b.theme);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    const succeededCount = sortedPredictions.filter(p => p.status === 'succeeded').length;
    const totalTargets = renderMode === 'style-ref' ? 1 : selectedThemes.length;

    // Ref to hold current blob URLs for unmount cleanup
    const urlsRef = useRef<string[]>([]);
    useEffect(() => {
        urlsRef.current = [...previewUrls, ...(previewUrl ? [previewUrl] : [])];
    }, [previewUrls, previewUrl]);

    // Cleanup object URLs only on component unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            urlsRef.current.forEach(url => {
                if (url.startsWith('blob:')) URL.revokeObjectURL(url);
            });
        };
    }, []);

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

    async function generatePhoto(fileUrl: string | string[], theme: themeType | string, room: roomType, origImageId: string | null) {
        try {
            const body: any = { theme, room, roomCondition };
            if (renderMode === 'style-ref' && customPrompt.trim() !== '') {
                body.customPrompt = customPrompt.trim();
            }
            if (Array.isArray(fileUrl)) {
                body.imageUrls = fileUrl;
            } else {
                body.imageUrl = fileUrl;
            }

            const res = await fetch("/api/gen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
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
            if (res && res.length > 0) {
                const urls = res.map(f => f.ufsUrl);
                const firstUrl = urls[0];
                const firstId = res[0].key;
                
                setImageUrl(firstUrl);
                setImageUrls(urls);
                setOriginalImageId(firstId);
                
                const finalUrl = renderMode === 'style-ref' ? urls : firstUrl;
                const themesToRender = renderMode === 'style-ref' ? ["Custom Style"] : selectedThemes;
                themesToRender.forEach(theme => generatePhoto(finalUrl, theme as themeType, room, firstId));
            }
        },
        onUploadError: () => {
            setIsUploading(false);
            setError("Upload failed. Please try again.");
        },
    });

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (renderMode === 'style-ref') {
            setSelectedFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(f => URL.createObjectURL(f));
            setPreviewUrls(prev => {
                const combined = [...prev, ...newPreviews];
                setPreviewUrl(combined[0]); // update main preview for compatibility
                return combined;
            });
        } else {
            // Cleanup old previews
            if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
            previewUrls.forEach(url => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); });

            const file = files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setPreviewUrls([]);
            setSelectedFiles([]);
        }
        
        setImageUrl(null);
        setImageUrls([]);
        setPredictions({});
        setError(null);
        
        // Reset input value so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [previewUrl, previewUrls, renderMode]);

    const removeFile = useCallback((indexToRemove: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== indexToRemove));
        setPreviewUrls(prev => {
            const newUrls = prev.filter((_, i) => i !== indexToRemove);
            if (prev[indexToRemove] && prev[indexToRemove].startsWith('blob:')) {
                URL.revokeObjectURL(prev[indexToRemove]);
            }
            if (newUrls.length > 0) {
                setPreviewUrl(newUrls[0]);
            } else {
                setPreviewUrl(null);
            }
            return newUrls;
        });
        setImageUrl(null);
        setImageUrls([]);
        setPredictions({});
        setError(null);
    }, []);

    const hasSelection = renderMode === 'style-ref' ? (selectedFiles.length > 0 || imageUrls.length > 0) : (!!selectedFile || !!imageUrl);

    const handleUpload = useCallback(async () => {
        if (!hasSelection) {
            setError("Please select image(s) first.");
            return;
        }
        if (renderMode === 'standard' && selectedThemes.length === 0) {
            setError("Please select at least one theme.");
            return;
        }

        setError(null);

        const initialPredictions: Record<string, PredictionState> = {};
        const themesToRender = renderMode === 'style-ref' ? ["Custom Style"] : selectedThemes;
        
        themesToRender.forEach(theme => {
            const tempId = `temp_${theme}_${Date.now()}`;
            initialPredictions[tempId] = { id: tempId, status: "queued", theme: theme as themeType };
        });
        setPredictions(initialPredictions);

        if (renderMode === 'style-ref') {
            if (imageUrls.length > 0) {
                themesToRender.forEach(theme => generatePhoto(imageUrls, theme as themeType, room, originalImageId));
            } else if (selectedFiles.length > 0) {
                await startUpload(selectedFiles, { design: 'interior', type: 'style-ref' });
            }
        } else {
            if (imageUrl) {
                selectedThemes.forEach(theme => generatePhoto(imageUrl, theme, room, originalImageId));
            } else if (selectedFile) {
                await startUpload([selectedFile], { design: 'interior', type: 'original' });
            }
        }
    }, [selectedFile, selectedFiles, imageUrl, imageUrls, selectedThemes, startUpload, room, originalImageId, renderMode]);

    const clearImage = () => {
        setImageUrl(null);
        setImageUrls([]);
        setSelectedFile(null);
        setSelectedFiles([]);
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        previewUrls.forEach(url => {
            if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        });
        setPreviewUrl(null);
        setPreviewUrls([]);
        setPredictions({});
        setError(null);
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
                role="dialog"
                aria-modal="true"
                aria-label="Image preview"
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
                    aria-label="Close image preview"
                >✕</button>
            </div>
        )}

        <div className="max-w-[1600px] mx-auto p-4 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start h-full">

                {/* Sidebar */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-8 lg:sticky lg:top-4 px-2">

                    {/* 0. Generation Mode */}
                    <section className="space-y-3">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Render Mode</p>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => { setRenderMode("standard"); clearImage(); }}
                                aria-pressed={renderMode === "standard"}
                                className={clsx(
                                    "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                    renderMode === "standard" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                Standard
                            </button>
                            <button
                                onClick={() => { setRenderMode("style-ref"); clearImage(); }}
                                aria-pressed={renderMode === "style-ref"}
                                className={clsx(
                                    "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                    renderMode === "style-ref" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                Style Ref
                            </button>
                        </div>
                    </section>

                    {/* 1. Upload */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                {renderMode === 'style-ref' ? '1. Room + Styles' : '1. Original Room'}
                            </p>
                            {renderMode === 'style-ref' && (
                                <span className="text-[9px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded">Multi-upload</span>
                            )}
                        </div>
                        
                        {!imageUrl && !previewUrl && previewUrls.length === 0 ? (
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        fileInputRef.current?.click();
                                    }
                                }}
                                aria-label={renderMode === 'style-ref' ? 'Upload room and style references' : 'Upload room'}
                                className="group cursor-pointer flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12 transition-all hover:border-gray-900 hover:bg-white"
                            >
                                <ArrowUpTrayIcon className="w-8 h-8 text-gray-300 group-hover:text-gray-900 transition-colors" />
                                <p className="mt-3 text-[10px] font-black text-gray-400 uppercase text-center px-4">
                                    {renderMode === 'style-ref' ? 'Upload Room & Style References' : 'Click to upload room'}
                                </p>
                                <input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    accept="image/*" 
                                    multiple={renderMode === 'style-ref'}
                                    className="sr-only" 
                                    onChange={handleFileSelect} 
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {renderMode === 'style-ref' && previewUrls.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {previewUrls.map((url, i) => (
                                            <div key={url} className={clsx(
                                                "relative aspect-square rounded-lg overflow-hidden ring-1 ring-gray-100 group",
                                                i === 0 ? "ring-2 ring-gray-900 shadow-lg" : ""
                                            )}>
                                                <Image src={url} alt={`Preview ${i}`} fill className="object-cover" />
                                                {i === 0 && (
                                                    <div className="absolute top-1 left-1 bg-gray-900 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded pointer-events-none">Target</div>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                                    className="absolute top-1 right-1 bg-black/40 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all z-10"
                                                    aria-label={`Remove image ${i + 1}`}
                                                >
                                                    <XMarkIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-square flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-900 transition-all group"
                                            aria-label="Add more reference images"
                                        >
                                            <ArrowUpTrayIcon className="w-4 h-4 text-gray-300 group-hover:text-gray-900" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative group rounded-xl overflow-hidden ring-1 ring-gray-100 aspect-[4/3] w-full">
                                        <Image src={previewUrl || imageUrl || ""} alt="Preview" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-white uppercase border border-white/50 px-6 py-2.5 rounded-lg backdrop-blur-md hover:bg-white hover:text-black transition-all" aria-label="Change uploaded photo">Change Photo</button>
                                        </div>
                                    </div>
                                )}
                                <button onClick={clearImage} className="w-full py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors">Clear All</button>
                                <input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    accept="image/*" 
                                    multiple={renderMode === 'style-ref'}
                                    className="sr-only" 
                                    onChange={handleFileSelect} 
                                />
                            </div>
                        )}
                    </section>

                    {/* 1.5 Room Condition */}
                    <section className="space-y-2">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">2. Room Condition</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setRoomCondition("raw")}
                                aria-pressed={roomCondition === "raw"}
                                className={clsx(
                                    "py-3 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    roomCondition === "raw"
                                        ? "bg-gray-900 text-white"
                                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                )}
                            >
                                Raw / Empty
                            </button>
                            <button
                                onClick={() => setRoomCondition("finished")}
                                aria-pressed={roomCondition === "finished"}
                                className={clsx(
                                    "py-3 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    roomCondition === "finished"
                                        ? "bg-gray-900 text-white"
                                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                )}
                            >
                                Decorated
                            </button>
                        </div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-1">
                            {roomCondition === "raw"
                                ? "Beautify & furnish an empty/construction room"
                                : "Change the style of an already decorated room"}
                        </p>
                    </section>

                    {/* 3. Room Type */}
                    <section className="space-y-2">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">3. Room Type</p>
                        <DropDown
                            theme={room}
                            setTheme={(newRoom) => startTransition(() => setRoom(newRoom as roomType))}
                            themes={rooms}
                        />
                    </section>

                    {/* 3. Themes - Only show in Standard mode */}
                    {renderMode === 'standard' && (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">4. Style Themes</p>
                                <span className="text-[10px] font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-full">{selectedThemes.length}/4</span>
                            </div>
                            <div className="grid grid-cols-3 gap-y-4 gap-x-3">
                                {themes.map((t) => (
                                    <div key={t.name} className="space-y-1.5">
                                        <div
                                            onClick={() => toggleTheme(t.name)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    toggleTheme(t.name);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            aria-pressed={selectedThemes.includes(t.name)}
                                            aria-label={`Toggle ${t.name} theme`}
                                            className={clsx(
                                                "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200",
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
                                        <p className={clsx(
                                            "text-xs font-bold text-center truncate",
                                            selectedThemes.includes(t.name) ? "text-gray-900" : "text-gray-400"
                                        )}>
                                            {t.name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 4. Custom Prompt - Only show in Style Ref mode */}
                    {renderMode === 'style-ref' && (
                        <section className="space-y-4">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">4. Custom Prompt (Optional)</p>
                            <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="E.g. Make it cozy with warm lighting, add some indoor plants..."
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-0 transition-all resize-none h-24"
                            />
                        </section>
                    )}

                    {/* Quality + Render */}
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                        <section className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Render Quality</p>
                            <DropDown
                                theme={quality}
                                setTheme={(newQuality) => startTransition(() => setQuality(newQuality as qualityType))}
                                themes={qualities}
                            />
                        </section>

                        <button
                            onClick={handleUpload}
                            disabled={isUploading || isGenerating || !hasSelection}
                            className="w-full py-5 bg-gray-900 text-white text-base font-black rounded-xl hover:bg-black transition-all transform active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-3"
                        >
                            {isUploading || isGenerating ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="uppercase tracking-[0.2em] text-xs">Start Rendering</span>
                            )}
                        </button>

                        <div className="flex items-center justify-between px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span>Credits Required</span>
                            <span className="text-gray-900 font-black">
                                {renderMode === 'style-ref' ? (quality === "Pro - 2 credits" ? 2 : 1) : (selectedThemes.length * (quality === "Pro - 2 credits" ? 2 : 1))} Units
                            </span>
                        </div>
                    </div>

                    {error && (
                        <p aria-live="polite" className="text-[10px] font-black text-red-500 text-center uppercase tracking-tighter bg-red-50 py-3 rounded-lg border border-red-100">{error}</p>
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
                                        {totalTargets === 0 ? '0 / 1' : `${succeededCount} / ${totalTargets}`}
                                    </span>
                                </div>
                                <div className="w-64 h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-900 transition-all duration-700 ease-out" style={{ width: `${(succeededCount / Math.max(totalTargets, 1)) * 100}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-2">
                            {/* Predictions in theme order */}
                            {sortedPredictions.map((p) => (
                                <div key={p.id} className="group space-y-4">
                                    <div className="relative aspect-square rounded-xl overflow-hidden bg-white border border-gray-100">
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
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setModalImage(p.resultUrl!);
                                                    }
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`Open ${p.theme} preview`}
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
                                                aria-label={`Download ${p.theme} image`}
                                            >
                                                <ArrowUpTrayIcon className="w-4 h-4 -rotate-180" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Draft slots */}
                            {renderMode === 'standard' ? (
                                selectedThemes
                                    .filter(themeName => !sortedPredictions.some(p => p.theme === themeName))
                                    .map((themeName) => (
                                        <div key={themeName} className="space-y-4 opacity-50">
                                            <div className="relative aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                                                <div className="text-center space-y-2">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto flex items-center justify-center border border-gray-200">
                                                        <Image src={themes.find(t => t.name === themeName)?.image || ""} alt="Draft" width={24} height={24} className="opacity-40 grayscale rounded-lg" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ready to Render</p>
                                                </div>
                                            </div>
                                            <div className="px-2 space-y-0.5">
                                                <p className="text-sm font-black text-gray-400 uppercase tracking-tight">{themeName}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{room} • Pending</p>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                !sortedPredictions.some(p => p.theme === "Custom Style") && (
                                    <div className="space-y-4 opacity-50">
                                        <div className="relative aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                                            <div className="text-center space-y-2">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto flex items-center justify-center border border-gray-200">
                                                    <ArrowUpTrayIcon className="w-6 h-6 text-gray-300" />
                                                </div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ready to Render</p>
                                            </div>
                                        </div>
                                        <div className="px-2 space-y-0.5">
                                            <p className="text-sm font-black text-gray-400 uppercase tracking-tight">Custom Style</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{room} • Style Reference</p>
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Empty state */}
                            {(renderMode === 'standard' ? selectedThemes.length === 0 : !hasSelection) && Object.keys(predictions).length === 0 && (
                                <div className="col-span-full h-[60vh] flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 text-center">
                                    <div className="relative w-48 h-48 mb-8">
                                        <Image src="/images/demo-industrial.png" alt="Workspace" fill sizes="192px" className="object-contain" />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">Studio Canvas</h3>
                                        <div className="w-10 h-0.5 bg-gray-900 mx-auto" />
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest max-w-xs mx-auto">
                                            {renderMode === 'standard' ? 'Select style themes from the sidebar to populate your workspace.' : 'Upload your room and style references to begin.'}
                                        </p>
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
