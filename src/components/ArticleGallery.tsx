"use client";

import React, { useState } from "react";

export type CollageLayoutType = "auto" | "grid2" | "hero_stack" | "row";

interface ArticleGalleryProps {
  images: string[];
  title?: string;
  layout?: CollageLayoutType | string | null;
}

export default function ArticleGallery({
  images,
  title = "Мақала фотосы",
  layout = "auto",
}: ArticleGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const list = images.filter(Boolean).slice(0, 4);
  if (list.length === 0) return null;

  const resolvedLayout: CollageLayoutType =
    layout === "grid2" ||
    layout === "hero_stack" ||
    layout === "row" ||
    layout === "auto"
      ? layout
      : "auto";

  const effectiveMode: Exclude<CollageLayoutType, "auto"> =
    resolvedLayout === "auto"
      ? list.length === 1
        ? "row"
        : list.length === 3 || list.length === 4
        ? "hero_stack"
        : "grid2"
      : resolvedLayout;

  function renderCard(
    src: string,
    idx: number,
    className: string,
    showBadge = false
  ) {
    return (
      <button
        key={`${src}-${idx}`}
        type="button"
        onClick={() => setActiveIndex(idx)}
        className={`group relative overflow-hidden bg-slate-900/5 dark:bg-slate-950 focus:outline-none cursor-pointer ${className}`}
      >
        <img
          src={src}
          alt={`${title} — ${idx + 1}`}
          className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

        {idx === 0 && showBadge && (
          <span className="pointer-events-none absolute top-2.5 left-2.5 rounded-md bg-amber-400/95 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-950 shadow-xs">
            №1
          </span>
        )}

        <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/65 backdrop-blur-xs px-2 py-0.5 text-[11px] font-semibold text-white">
          {idx + 1}/{list.length}
        </span>
      </button>
    );
  }

  function renderBody() {
    if (list.length === 1) {
      return renderCard(list[0], 0, "w-full aspect-video max-h-[440px] rounded-xl", false);
    }

    if (effectiveMode === "row") {
      const cols =
        list.length === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : list.length === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-4";

      return (
        <div className={`grid ${cols} gap-2`}>
          {list.map((src, idx) =>
            renderCard(src, idx, "h-48 sm:h-52 w-full rounded-xl", list.length > 2)
          )}
        </div>
      );
    }

    if (effectiveMode === "grid2") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {list.map((src, idx) =>
            renderCard(src, idx, "h-52 sm:h-60 w-full rounded-xl", idx === 0)
          )}
        </div>
      );
    }

    const [first, ...rest] = list;
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-7">
          {renderCard(
            first,
            0,
            "w-full h-64 sm:h-80 md:h-full min-h-[260px] rounded-xl",
            true
          )}
        </div>
        <div
          className={`md:col-span-5 grid gap-2 ${
            rest.length === 1
              ? "grid-cols-1"
              : rest.length === 2
              ? "grid-rows-2"
              : "grid-rows-3"
          }`}
        >
          {rest.map((src, i) =>
            renderCard(
              src,
              i + 1,
              "w-full h-28 sm:h-32 md:h-full min-h-[96px] rounded-xl",
              false
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="my-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-2 sm:p-2.5 shadow-sm">
        {renderBody()}
      </div>

      {activeIndex !== null && list[activeIndex] && (
        <div
          onClick={() => setActiveIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full space-y-3"
          >
            <div className="flex items-center justify-between text-white text-sm">
              <span className="font-semibold">
                {activeIndex + 1} / {list.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <img
              src={list[activeIndex]}
              alt={`${title} — ${activeIndex + 1}`}
              className="w-full max-h-[80vh] object-contain rounded-xl bg-black mx-auto"
            />

            {list.length > 1 && (
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) =>
                      prev === null
                        ? 0
                        : (prev - 1 + list.length) % list.length
                    )
                  }
                  className="px-4 py-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 cursor-pointer"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) =>
                      prev === null ? 0 : (prev + 1) % list.length
                    )
                  }
                  className="px-4 py-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 cursor-pointer"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}