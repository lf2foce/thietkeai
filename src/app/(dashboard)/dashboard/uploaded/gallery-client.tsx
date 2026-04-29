'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

type GalleryImage = {
  id: number;
  url: string;
  name: string | null;
  createdAt: Date;
  type: string;
  originalImageId: string | null;
};

type ImagePair = {
  id: string;
  processed: GalleryImage;
  original?: GalleryImage;
  createdAt: Date;
};

type GalleryClientProps = {
  images: GalleryImage[];
};

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

const PAGE_SIZE = 12;

export default function GalleryClient({ images }: GalleryClientProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const pairedImages = useMemo(() => {
    const processed = images.filter((img) => img.type === 'processed');
    const originals = images.filter((img) => img.type === 'original');

    const originalMap = new Map<string, GalleryImage>();
    originals.forEach((img) => {
      if (img.originalImageId) {
        originalMap.set(img.originalImageId, img);
      } else {
        // Fallback for older images where originalImageId was not saved.
        // The UploadThing URL contains the file key at the end (which is used as originalImageId for processed images).
        const keyFromUrl = img.url.split('/').pop();
        if (keyFromUrl) {
          originalMap.set(keyFromUrl, img);
        }
      }
    });

    const pairs: ImagePair[] = processed.map((proc) => ({
      id: String(proc.id),
      processed: proc,
      original: proc.originalImageId ? originalMap.get(proc.originalImageId) : undefined,
      createdAt: proc.createdAt,
    }));

    // Sort by created descending
    return pairs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [images]);

  const activePair = activeIndex === null ? null : pairedImages[activeIndex];
  const totalPairs = pairedImages.length;
  const latestPair = pairedImages[0];
  const totalPages = Math.ceil(totalPairs / PAGE_SIZE);

  const currentPairs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return pairedImages.slice(start, start + PAGE_SIZE);
  }, [pairedImages, currentPage]);

  const dateSummary = useMemo(() => {
    if (!latestPair) return null;
    return formatDateLabel(new Date(latestPair.createdAt));
  }, [latestPair]);

  const closeModal = () => setActiveIndex(null);

  const openModal = (globalIndex: number) => setActiveIndex(globalIndex);

  const showPrevious = () => {
    setActiveIndex((current) => {
      if (current === null) return current;
      return current === 0 ? pairedImages.length - 1 : current - 1;
    });
  };

  const showNext = () => {
    setActiveIndex((current) => {
      if (current === null) return current;
      return current === pairedImages.length - 1 ? 0 : current + 1;
    });
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
      if (event.key === 'ArrowLeft') {
        showPrevious();
      }
      if (event.key === 'ArrowRight') {
        showNext();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, pairedImages.length]);

  if (pairedImages.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 h-full">
        <div className="h-[60vh] flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 text-center">
          <div className="relative w-24 h-24 mb-8 text-gray-200">
            <PhotoIcon className="w-full h-full" />
          </div>
          <div className="space-y-3">
            <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">Gallery Empty</h3>
            <div className="w-10 h-0.5 bg-gray-900 mx-auto" />
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest max-w-sm mx-auto">
              Generate a few interior renders first and they will show up here as a clean review wall.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[1600px] mx-auto p-4 h-full">
        <div className="space-y-12 pb-20">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-8 px-2">
            <div className="space-y-1">
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Gallery</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Before & After Archive</p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Renders</span>
                  <span className="text-sm font-black text-gray-900">{totalPairs}</span>
                </div>
                <div className="w-px h-6 bg-gray-200"></div>
                <div className="text-right">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Latest Saved</span>
                  <span className="text-sm font-black text-gray-900">{dateSummary ?? 'Just now'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 text-[10px] font-black tracking-widest uppercase text-gray-500 mb-8 flex items-center gap-3">
              <ArrowsRightLeftIcon className="w-4 h-4 text-gray-900" />
              <span><span className="text-gray-900">Hover</span> over grid images to reveal the original before image. Click to view side-by-side comparison. Processed images are stored for the current day only.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {currentPairs.map((pair, index) => {
                const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
                return (
                  <div key={pair.id} className="group space-y-4">
                    <div
                      className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-zoom-in group/pair shadow-sm hover:shadow-md transition-all"
                      onClick={() => openModal(globalIndex)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openModal(globalIndex);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open image ${globalIndex + 1}`}
                    >
                      {/* After Image (Always on top, fades out on hover if original exists) */}
                      <img
                        src={pair.processed.url}
                        alt={pair.processed.name || `Generated image ${globalIndex + 1}`}
                        className={clsx(
                          "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-10",
                          pair.original ? "opacity-100 group-hover/pair:opacity-0" : ""
                        )}
                      />

                      {/* Before Image (Hidden underneath, revealed on hover) */}
                      {pair.original && (
                        <img
                          src={pair.original.url}
                          alt="Original room"
                          className="absolute inset-0 w-full h-full object-cover z-0"
                        />
                      )}

                      <div className="absolute top-3 left-3 z-20 pointer-events-none transition-opacity duration-300">
                        <span className="bg-black/50 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md border border-white/10 shadow-sm">
                          {pair.original ? "Hover for Before" : "Generated"}
                        </span>
                      </div>

                      <div className="absolute inset-0 bg-black/0 group-hover/pair:bg-black/5 transition-colors duration-300 z-30 pointer-events-none" />
                    </div>

                    <div className="flex items-center justify-between px-2">
                      <div className="space-y-0.5">
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                          Render {String(globalIndex + 1).padStart(2, '0')}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {formatDateLabel(new Date(pair.createdAt))}
                        </p>
                      </div>
                      <button
                        onClick={() => downloadImage(pair.processed.url, `${pair.processed.name || `render-${pair.id}`}.jpg`)}
                        className="bg-gray-100 text-gray-600 hover:text-gray-900 p-2.5 rounded-xl transition-all hover:bg-gray-200 active:scale-90"
                        title="Download"
                        aria-label={`Download image ${globalIndex + 1}`}
                      >
                        <ArrowDownTrayIcon className="w-4 h-4 -rotate-180" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl border border-gray-200 text-gray-900 disabled:opacity-30 hover:bg-gray-50 transition-all active:scale-95"
                  aria-label="Previous page"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-gray-900">{currentPage}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">/</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl border border-gray-200 text-gray-900 disabled:opacity-30 hover:bg-gray-50 transition-all active:scale-95"
                  aria-label="Next page"
                >
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {activePair && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 md:p-4 cursor-zoom-out backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={closeModal}
        >
          <div className="relative w-full max-w-none h-full flex flex-col pointer-events-none">

            {/* Navigation Buttons */}
            {totalPairs > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); showPrevious(); }}
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/10 text-white transition-all pointer-events-auto z-20"
                >
                  <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); showNext(); }}
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/10 text-white transition-all pointer-events-auto z-20"
                >
                  <ArrowRightIcon className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image container: Split view if original exists */}
            <div
              className="absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 pointer-events-auto p-2 md:p-4 pb-24 md:pb-4"
              onClick={e => e.stopPropagation()}
            >
              {activePair.original && (
                <div className="relative flex-1 h-full w-full flex items-center justify-center bg-black/40 rounded-2xl border border-white/10 overflow-hidden">
                  <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg z-10 border border-white/10 shadow-lg">
                    Before
                  </span>

                  {/* Loading Skeleton */}
                  <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse -z-10">
                    <PhotoIcon className="w-12 h-12 text-white/20" />
                  </div>

                  <img
                    key={`original-${activePair.id}`} // Force re-render for loading state
                    src={activePair.original.url}
                    alt="Original room"
                    className="max-h-full max-w-full object-contain"
                    style={{ animation: 'fadeIn 0.3s ease-in-out' }}
                  />
                </div>
              )}

              <div className={clsx(
                "relative h-full flex items-center justify-center bg-black/40 rounded-2xl border border-white/10 overflow-hidden",
                activePair.original ? "flex-1 w-full" : "w-full max-w-full"
              )}>
                <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg z-10 border border-white/10 shadow-lg">
                  {activePair.original ? "After" : "Generated"}
                </span>

                {/* Loading Skeleton */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse -z-10">
                  <PhotoIcon className="w-12 h-12 text-white/20" />
                </div>

                <img
                  key={`processed-${activePair.id}`} // Force re-render for loading state
                  src={activePair.processed.url}
                  alt={activePair.processed.name || `Generated image ${activeIndex! + 1}`}
                  className="max-h-full max-w-full object-contain shadow-2xl"
                  style={{ animation: 'fadeIn 0.3s ease-in-out' }}
                />
              </div>
            </div>

            {/* Consolidated Bottom Bar (Floating Overlay) */}
            <div className="absolute bottom-0 flex flex-col md:flex-row justify-between items-center gap-4 py-4 md:py-6 px-4 md:px-8 pointer-events-auto z-10 w-full bg-gradient-to-t from-black/80 to-transparent">

              {/* Left: Preview Counter */}
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white flex items-center gap-3 shadow-lg">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Preview</span>
                <span className="text-sm font-black">{activeIndex! + 1} / {totalPairs}</span>
              </div>

              {/* Center: Generated Date (Hidden on very small screens if needed, but flex-col handles it) */}
              <div className="bg-white/10 backdrop-blur-md px-6 py-2 md:py-3 rounded-full border border-white/10 text-white flex items-center gap-3 shadow-lg">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Generated At</span>
                <span className="text-sm font-black">{formatDateLabel(new Date(activePair.createdAt))}</span>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadImage(activePair.processed.url, `${activePair.processed.name || `render-${activePair.id}`}.jpg`)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/10 text-white transition-all pointer-events-auto shadow-lg"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={closeModal}
                  className="bg-white/10 hover:bg-red-500/80 backdrop-blur-md p-3 rounded-full border border-white/10 text-white transition-all pointer-events-auto shadow-lg"
                  title="Close Preview"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </>
  );
}
