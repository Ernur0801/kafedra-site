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

  function renderTile(src: string, idx: number, extraClass = "") {
    return (
      <button
        key={`${src}-${idx}`}
        type="button"
        onClick={() => setActiveIndex(idx)}
        className={`group relative overflow-hidden bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center cursor-pointer focus:outline-none ${extraClass}`}
      >
        <img
          src={src}
          alt={`${title} — ${idx + 1}`}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </button>
    );
  }

  function renderCollageFrame() {
    if (list.length === 1 || effectiveMode === "row") {
      const colsClass =
        list.length === 1
          ? "grid-cols-1"
          : list.length === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : list.length === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-4";

      return (
        <div className={`grid ${colsClass} gap-2.5`}>
          {list.map((src, idx) =>
            renderTile(
              src,
              idx,
              list.length === 1
                ? "max-h-[460px] w-full rounded-xl"
                : "h-56 sm:h-64 w-full rounded-xl"
            )
          )}
        </div>
      );
    }

    if (effectiveMode === "grid2") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {list.map((src, idx) =>
            renderTile(src, idx, "h-60 sm:h-68 w-full rounded-xl")
          )}
        </div>
      );
    }

    // hero_stack: сол жақта бірінші фото, оң жақта қалғандары
    const [first, ...rest] = list;
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
        <div className="md:col-span-7 flex">
          {renderTile(first, 0, "w-full min-h-[260px] max-h-[420px] rounded-xl")}
        </div>
        <div
          className={`md:col-span-5 grid gap-2.5 ${
            rest.length === 1
              ? "grid-cols-1"
              : rest.length === 2
              ? "grid-rows-2"
              : "grid-rows-3"
          }`}
        >
          {rest.map((src, i) =>
            renderTile(
              src,
              i + 1,
              "w-full h-32 sm:h-36 md:h-full min-h-[110px] rounded-xl"
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="my-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 p-3 shadow-2xs">
        {renderCollageFrame()}
      </div>

      {activeIndex !== null && list[activeIndex] && (
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
              className="w-full max-h-[78vh] object-contain rounded-xl bg-black"
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