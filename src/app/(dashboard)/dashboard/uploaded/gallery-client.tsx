'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  XMarkIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

type GalleryImage = {
  id: number;
  url: string;
  name: string | null;
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

  const activeImage = activeIndex === null ? null : images[activeIndex];
  const totalImages = images.length;
  const latestImage = images[0];
  const totalPages = Math.ceil(totalImages / PAGE_SIZE);

  const currentImages = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return images.slice(start, start + PAGE_SIZE);
  }, [images, currentPage]);

  const dateSummary = useMemo(() => {
    if (!latestImage) return null;
    return formatDateLabel(new Date(latestImage.createdAt));
  }, [latestImage]);

  const closeModal = () => setActiveIndex(null);

  const openModal = (globalIndex: number) => setActiveIndex(globalIndex);

  const showPrevious = () => {
    setActiveIndex((current) => {
      if (current === null) return current;
      return current === 0 ? images.length - 1 : current - 1;
    });
  };

  const showNext = () => {
    setActiveIndex((current) => {
      if (current === null) return current;
      return current === images.length - 1 ? 0 : current + 1;
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
  }, [activeIndex, images.length]);

  if (images.length === 0) {
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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Image Archive & Management</p>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Images</span>
                  <span className="text-sm font-black text-gray-900">{totalImages}</span>
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
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 text-[10px] font-black tracking-widest uppercase text-gray-500 mb-8">
              <span className="text-gray-900">Notice:</span> Processed images are stored for the current day only. For long-term storage, please contact us through the feedback page.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {currentImages.map((image, index) => {
                const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
                return (
                  <div key={image.id} className="group space-y-4">
                    <div 
                      className="relative aspect-square rounded-xl overflow-hidden bg-white border border-gray-100 cursor-zoom-in"
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
                      <img
                        src={image.url}
                        alt={image.name || `Generated image ${globalIndex + 1}`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>

                    <div className="flex items-center justify-between px-2">
                      <div className="space-y-0.5">
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                          Render {String(globalIndex + 1).padStart(2, '0')}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {formatDateLabel(new Date(image.createdAt))}
                        </p>
                      </div>
                      <button
                        onClick={() => downloadImage(image.url, `${image.name || `render-${image.id}`}.jpg`)}
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
      {activeImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={closeModal}
        >
          <div className="relative w-full max-w-[95vw] max-h-[95vh] flex flex-col items-center justify-center pointer-events-none">
            
            {/* Top Bar */}
            <div className="absolute top-0 w-full flex justify-between items-center p-4 pointer-events-auto z-10">
              <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Preview</span>
                <span className="text-sm font-black">{activeIndex! + 1} / {totalImages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadImage(activeImage.url, `${activeImage.name || `render-${activeImage.id}`}.jpg`)}
                  className="bg-black/50 hover:bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/10 text-white transition-all pointer-events-auto"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={closeModal}
                  className="bg-black/50 hover:bg-red-500 backdrop-blur-md p-3 rounded-full border border-white/10 text-white transition-all pointer-events-auto"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Buttons */}
            {totalImages > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); showPrevious(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/10 text-white transition-all pointer-events-auto"
                >
                  <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); showNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/10 text-white transition-all pointer-events-auto"
                >
                  <ArrowRightIcon className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image container */}
            <img
              src={activeImage.url}
              alt={activeImage.name || `Generated image ${activeIndex! + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl pointer-events-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            
            {/* Bottom Bar */}
            <div className="absolute bottom-0 w-full p-4 pointer-events-none flex justify-center">
              <div className="bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white pointer-events-auto">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 text-center mb-1">Generated At</p>
                <p className="text-sm font-black">{formatDateLabel(new Date(activeImage.createdAt))}</p>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}
