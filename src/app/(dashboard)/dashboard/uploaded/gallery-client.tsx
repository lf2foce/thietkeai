'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  XMarkIcon,
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

export default function GalleryClient({ images }: GalleryClientProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeImage = activeIndex === null ? null : images[activeIndex];
  const totalImages = images.length;
  const latestImage = images[0];

  const dateSummary = useMemo(() => {
    if (!latestImage) return null;
    return formatDateLabel(new Date(latestImage.createdAt));
  }, [latestImage]);

  const closeModal = () => setActiveIndex(null);

  const openModal = (index: number) => setActiveIndex(index);

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
      <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
          Gallery Empty
        </p>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
          No processed images yet.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
          Generate a few interior renders first and they will show up here as a clean review wall
          for quick browsing and download.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 border-b border-slate-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
              Image Archive
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              Your generated interiors.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
              Review finished renders, open them in a larger preview, and move left or right
              through the full set without leaving the page.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Total Images
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">{totalImages}</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Latest Saved
              </p>
              <p className="mt-2 text-sm font-bold text-slate-700">{dateSummary ?? 'Just now'}</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Preview Mode
              </p>
              <p className="mt-2 text-sm font-bold text-slate-700">Arrow Navigation</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-rose-100 bg-rose-50 px-5 py-4 text-sm leading-6 text-rose-500">
          <span className="font-semibold uppercase tracking-[0.16em]">Notice</span>
          {' '}
          Processed images are stored for the current day only. For long-term storage, please
          contact us through the feedback page.
        </div>

        <div className="mt-8 columns-1 gap-5 sm:columns-2 xl:columns-3 2xl:columns-4">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => openModal(index)}
              className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              aria-label={`Open image ${index + 1} of ${images.length}`}
            >
              <div className="relative overflow-hidden">
                <img
                  src={image.url}
                  alt={image.name || `Generated image ${index + 1}`}
                  className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Render {String(index + 1).padStart(2, '0')}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {formatDateLabel(new Date(image.createdAt))}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  View
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={closeModal}
        >
          <div
            className="relative flex max-h-full w-full max-w-7xl items-center justify-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={showPrevious}
              className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 md:flex"
              aria-label="Previous image"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>

            <div className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white md:px-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
                    Preview
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {activeIndex + 1} / {images.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadImage(
                        activeImage.url,
                        `${activeImage.name || `render-${activeImage.id}`}.jpg`,
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Download image"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Close preview"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="relative flex max-h-[78vh] items-center justify-center bg-slate-950">
                <img
                  src={activeImage.url}
                  alt={activeImage.name || `Generated image ${activeIndex + 1}`}
                  className="max-h-[78vh] w-full object-contain"
                />

                <button
                  type="button"
                  onClick={showPrevious}
                  className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-slate-900/70 text-white transition hover:bg-slate-800 md:hidden"
                  aria-label="Previous image"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-slate-900/70 text-white transition hover:bg-slate-800 md:hidden"
                  aria-label="Next image"
                >
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-4 text-white/80 md:px-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
                    Saved At
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatDateLabel(new Date(activeImage.createdAt))}
                  </p>
                </div>
                <div className="hidden items-center gap-2 md:flex">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={clsx(
                        'h-2.5 rounded-full transition-all',
                        index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/30 hover:bg-white/50',
                      )}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={showNext}
              className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 md:flex"
              aria-label="Next image"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
