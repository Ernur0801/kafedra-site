"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = "articles";

interface ArticlePhotoUploaderProps {
  images: string[];
  onChange: (urls: string[]) => void;
  maxPhotos?: number;
  lang?: "kk" | "ru" | "en";
}

export default function ArticlePhotoUploader({
  images,
  onChange,
  maxPhotos = 4,
  lang = "kk",
}: ArticlePhotoUploaderProps) {
  const [queue, setQueue] = useState<File[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (cropSrc || queue.length === 0) return;
    const [nextFile, ...rest] = queue;
    setQueue(rest);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropSrc(reader.result);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      }
    };
    reader.readAsDataURL(nextFile);
  }, [cropSrc, queue]);

  function handleSelectFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg(null);
    const available = maxPhotos - images.length;
    if (available <= 0) {
      setErrorMsg(
        lang === "ru"
          ? `Максимум ${maxPhotos} фото.`
          : `Ең көбі ${maxPhotos} фото қосуға болады.`
      );
      e.target.value = "";
      return;
    }

    const valid: File[] = [];
    for (const file of Array.from(files).slice(0, available)) {
      if (!file.type.startsWith("image/")) {
        setErrorMsg(
          lang === "ru"
            ? "Выберите файл изображения (JPG, PNG, WEBP)."
            : "Тек сурет файлдарын таңдаңыз (JPG, PNG, WEBP)."
        );
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(
          lang === "ru"
            ? "Размер фото не должен превышать 10 МБ."
            : "Сурет көлемі 10 МБ-тан аспауы керек."
        );
        continue;
      }
      valid.push(file);
    }

    if (valid.length > 0) {
      setQueue(valid);
    }
    e.target.value = "";
  }

  function handleAddUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setErrorMsg(null);

    if (images.length >= maxPhotos) {
      setErrorMsg(
        lang === "ru"
          ? `Максимум ${maxPhotos} фото.`
          : `Ең көбі ${maxPhotos} фото қосуға болады.`
      );
      return;
    }
    if (images.includes(trimmed)) {
      setErrorMsg(
        lang === "ru" ? "Это фото уже добавлено." : "Бұл фото тізімде бар."
      );
      return;
    }

    onChange([...images, trimmed].slice(0, maxPhotos));
    setUrlInput("");
  }

  function handleRemove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function handleMakeMain(index: number) {
    if (index <= 0 || index >= images.length) return;
    const copy = [...images];
    const [selected] = copy.splice(index, 1);
    onChange([selected, ...copy]);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || !dragStartRef.current) return;
    setOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  }

  function onPointerUp() {
    setIsDragging(false);
    dragStartRef.current = null;
  }

  async function handleConfirmCrop() {
    const img = imgRef.current;
    const box = boxRef.current;
    if (!img || !box) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      const boxRect = box.getBoundingClientRect();
      const boxW = boxRect.width;
      const boxH = boxRect.height;

      const natW = img.naturalWidth || 1280;
      const natH = img.naturalHeight || 720;

      // Көріністегі суреттің нақты өлшемі (cover масштабы * zoom)
      const coverScale = Math.max(boxW / natW, boxH / natH);
      const drawW = natW * coverScale * zoom;
      const drawH = natH * coverScale * zoom;

      // Кадр ішіндегі суреттің сол жақ жоғарғы нүктесі
      const leftInBox = (boxW - drawW) / 2 + offset.x;
      const topInBox = (boxH - drawH) / 2 + offset.y;

      // Кадрдың [0..boxW, 0..boxH] бөлігіне түсетін түпнұсқа координаттар
      const sx = ((0 - leftInBox) / drawW) * natW;
      const sy = ((0 - topInBox) / drawH) * natH;
      const sw = (boxW / drawW) * natW;
      const sh = (boxH / drawH) * natH;

      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas контексті алынбады");
      }

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Қиып алынған аймақты 1280x720 (16:9) холстқа салу
      const clampedSx = Math.max(0, Math.min(natW, sx));
      const clampedSy = Math.max(0, Math.min(natH, sy));
      const clampedSw = Math.max(1, Math.min(natW - clampedSx, sw - Math.max(0, -sx)));
      const clampedSh = Math.max(1, Math.min(natH - clampedSy, sh - Math.max(0, -sy)));

      const dx = sx < 0 ? (-sx / sw) * canvas.width : 0;
      const dy = sy < 0 ? (-sy / sh) * canvas.height : 0;
      const dw = (clampedSw / sw) * canvas.width;
      const dh = (clampedSh / sh) * canvas.height;

      ctx.drawImage(
        img,
        clampedSx,
        clampedSy,
        clampedSw,
        clampedSh,
        dx,
        dy,
        dw,
        dh
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Blob жасалмады"))),
          "image/jpeg",
          0.9
        );
      });

      const fileName = `covers/${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000
      )}.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, blob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/jpeg",
        });

      if (uploadErr) {
        throw new Error(uploadErr.message);
      }

      const { data: pub } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);

      if (pub?.publicUrl) {
        onChange([...images, pub.publicUrl].slice(0, maxPhotos));
      }

      setCropSrc(null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Қате шықты");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700">
          {lang === "ru"
            ? `Фото (${images.length}/${maxPhotos}) — обрезка 16:9`
            : `Фото (${images.length}/${maxPhotos}) — 16:9 қиып реттеу`}
        </label>
        <span className="text-xs text-slate-500">
          {lang === "ru" ? "1-е фото главное" : "1-ші фото негізгі"}
        </span>
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        disabled={uploading || images.length >= maxPhotos}
        onChange={handleSelectFiles}
        className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#003366] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[#002244] file:cursor-pointer disabled:opacity-60"
      />

      <div className="flex gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://..."
          className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
        />
        <button
          type="button"
          onClick={handleAddUrl}
          className="rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-800 cursor-pointer"
        >
          {lang === "ru" ? "Добавить" : "Қосу"}
        </button>
      </div>

      {errorMsg && (
        <p className="text-xs font-medium text-red-600">{errorMsg}</p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
            >
              <img
                src={url}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {idx === 0 ? (
                <span className="absolute top-1.5 left-1.5 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                  {lang === "ru" ? "Главное" : "Негізгі"}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleMakeMain(idx)}
                  className="absolute bottom-1.5 left-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-black cursor-pointer"
                >
                  {lang === "ru" ? "Главное" : "Негізгі ету"}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1.5 right-1.5 rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {lang === "ru"
                  ? "Обрезка фото (16:9)"
                  : "Фотоны қиып реттеу (16:9)"}
              </h3>
              <button
                type="button"
                onClick={() => setCropSrc(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div
              ref={boxRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 select-none touch-none cursor-grab active:cursor-grabbing flex items-center justify-center"
            >
              <img
                ref={imgRef}
                src={cropSrc}
                alt="Crop"
                draggable={false}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                }}
                className="w-full h-full object-cover pointer-events-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>{lang === "ru" ? "Масштаб" : "Масштаб"}</span>
                <span>{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[#003366] cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCropSrc(null)}
                disabled={uploading}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {lang === "ru" ? "Отмена" : "Болдырмау"}
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                disabled={uploading}
                className="rounded-xl bg-[#003366] hover:bg-[#002244] disabled:opacity-60 px-5 py-2 text-xs font-bold text-white cursor-pointer"
              >
                {uploading
                  ? lang === "ru"
                    ? "Загрузка..."
                    : "Жүктелуде..."
                  : lang === "ru"
                  ? "Применить"
                  : "Қиып қосу"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}