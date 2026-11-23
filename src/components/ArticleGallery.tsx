"use client";

import React, { useState } from "react";

interface ArticleGalleryProps {
  images: string[];
  title?: string;
}

export default function ArticleGallery({
  images,
  title = "Мақала суреті",
}: ArticleGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const validImages = images.filter(Boolean).slice(0, 4);
  if (validImages.length === 0) return null;

  const gridClass =
    validImages.length === 1
      ? "grid-cols-1"
      : validImages.length === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-2";

  return (
    <>
      <div className={`grid ${gridClass} gap-4 my-6`}>
        {validImages.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-left focus:outline-none"
          >
            <img
              src={src}
              alt={`${title} — ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          onClick={() => setActiveIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full space-y-3"
          >
            <div className="flex items-center justify-between text-white text-sm">
              <span>
                {activeIndex + 1} / {validImages.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25"
              >
                Жабу ✕
              </button>
            </div>

            <img
              src={validImages[activeIndex]}
              alt={`${title} — ${activeIndex + 1}`}
              className="w-full max-h-[78vh] object-contain rounded-xl bg-black"
            />

            {validImages.length > 1 && (
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) =>
                      prev === null
                        ? 0
                        : (prev - 1 + validImages.length) % validImages.length
                    )
                  }
                  className="px-4 py-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25"
                >
                  ← Алдыңғы
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) =>
                      prev === null ? 0 : (prev + 1) % validImages.length
                    )
                  }
                  className="px-4 py-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25"
                >
                  Келесі →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}