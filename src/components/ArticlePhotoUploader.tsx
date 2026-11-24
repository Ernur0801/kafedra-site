"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = "articles";

export type CropAspectMode = "original" | "16:9" | "4:3" | "1:1" | "3:4";

interface ArticlePhotoUploaderProps {
  images: string[];
  onChange: (urls: string[]) => void;
  maxPhotos?: number;
  lang?: "kk" | "ru" | "en";
}

const ASPECT_OPTIONS: {
  id: CropAspectMode;
  kk: string;
  ru: string;
  ratio: number | null; // null = түпнұсқа пропорция
}[] = [
  { id: "original", kk: "Түпнұсқа (қимай)", ru: "Оригинал (без обрезки)", ratio: null },
  { id: "16:9", kk: "16:9", ru: "16:9", ratio: 16 / 9 },
  { id: "4:3", kk: "4:3", ru: "4:3", ratio: 4 / 3 },
  { id: "1:1", kk: "1:1", ru: "1:1", ratio: 1 },
  { id: "3:4", kk: "3:4 (тік)", ru: "3:4 (верт.)", ratio: 3 / 4 },
];

export default function ArticlePhotoUploader({
  images,
  onChange,
  maxPhotos = 4,
  lang = "kk",
}: ArticlePhotoUploaderProps) {
  const [queue, setQueue] = useState<File[]>([]);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [aspectMode, setAspectMode] = useState<CropAspectMode>("original");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (cropSrc || queue.length === 0) return;
    const [nextFile, ...rest] = queue;
    setQueue(rest);
    setCropFile(nextFile);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropSrc(reader.result);
        setAspectMode("original");
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      }
    };
    reader.readAsDataURL(nextFile);
  }, [cropSrc, queue]);

  function closeCropModal() {
    setCropSrc(null);
    setCropFile(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

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
      if (file.size > 12 * 1024 * 1024) {
        setErrorMsg(
          lang === "ru"
            ? "Размер фото не должен превышать 12 МБ."
            : "Сурет көлемі 12 МБ-тан аспауы керек."
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

  async function uploadBlobOrFile(blobOrFile: Blob, ext = "jpg") {
    const cleanExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
    const fileName = `covers/${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000
    )}.${cleanExt}`;

    const { error: uploadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, blobOrFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: blobOrFile.type || `image/${cleanExt === "jpg" ? "jpeg" : cleanExt}`,
      });

    if (uploadErr) {
      throw new Error(uploadErr.message);
    }

    const { data: pub } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    if (!pub?.publicUrl) {
      throw new Error("Сілтеме алынбады");
    }

    return pub.publicUrl;
  }

  // Түпнұсқа фотоны еш қимай сол күйінде жүктеу
  async function handleKeepOriginal() {
    if (!cropFile) return;
    setUploading(true);
    setErrorMsg(null);

    try {
      const extFromName = cropFile.name.split(".").pop() || "jpg";
      const publicUrl = await uploadBlobOrFile(cropFile, extFromName);
      onChange([...images, publicUrl].slice(0, maxPhotos));
      closeCropModal();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Қате шықты");
    } finally {
      setUploading(false);
    }
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

  // Таңдалған формат/масштаб/жылжыту бойынша қиып жүктеу
  async function handleApplyCrop() {
    if (aspectMode === "original" && zoom === 1 && offset.x === 0 && offset.y === 0) {
      await handleKeepOriginal();
      return;
    }

    const img = imgRef.current;
    const frame = frameRef.current;
    if (!img || !frame) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      const natW = img.naturalWidth || 1200;
      const natH = img.naturalHeight || 800;

      const selectedOption =
        ASPECT_OPTIONS.find((o) => o.id === aspectMode) || ASPECT_OPTIONS[0];
      const targetRatio = selectedOption.ratio ?? natW / natH;

      const outW =
        targetRatio >= 1 ? 1280 : Math.max(640, Math.round(960 * targetRatio));
      const outH =
        targetRatio >= 1
          ? Math.max(480, Math.round(1280 / targetRatio))
          : 960;

      const frameRect = frame.getBoundingClientRect();
      const frameW = frameRect.width || 400;
      const frameH = frameRect.height || 300;

      const baseScale = Math.min(frameW / natW, frameH / natH);
      const drawW = natW * baseScale * zoom;
      const drawH = natH * baseScale * zoom;

      const leftInFrame = (frameW - drawW) / 2 + offset.x;
      const topInFrame = (frameH - drawH) / 2 + offset.y;

      const sx = ((0 - leftInFrame) / drawW) * natW;
      const sy = ((0 - topInFrame) / drawH) * natH;
      const sw = (frameW / drawW) * natW;
      const sh = (frameH / drawH) * natH;

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas контексті алынбады");
      }

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const clampedSx = Math.max(0, Math.min(natW, sx));
      const clampedSy = Math.max(0, Math.min(natH, sy));
      const clampedSw = Math.max(
        1,
        Math.min(natW - clampedSx, sw - Math.max(0, -sx))
      );
      const clampedSh = Math.max(
        1,
        Math.min(natH - clampedSy, sh - Math.max(0, -sy))
      );

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
          0.92
        );
      });

      const publicUrl = await uploadBlobOrFile(blob, "jpg");
      onChange([...images, publicUrl].slice(0, maxPhotos));
      closeCropModal();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Қате шықты");
    } finally {
      setUploading(false);
    }
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

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    onChange(copy);
  }

  const activeAspectObj =
    ASPECT_OPTIONS.find((o) => o.id === aspectMode) || ASPECT_OPTIONS[0];

  const previewFrameStyle: React.CSSProperties =
    activeAspectObj.ratio !== null
      ? { aspectRatio: String(activeAspectObj.ratio), maxHeight: "360px", width: "auto", maxWidth: "100%" }
      : { width: "100%", height: "340px" };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700">
          {lang === "ru"
            ? `Фото (${images.length}/${maxPhotos}) — без автоматической обрезки`
            : `Фото (${images.length}/${maxPhotos}) — қимай реттеу`}
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
              className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center h-32"
            >
              <img
                src={url}
                alt={`Photo ${idx + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              {idx === 0 && (
                <span className="absolute top-1.5 left-1.5 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                  {lang === "ru" ? "Главное" : "Негізгі"}
                </span>
              )}
              <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMove(idx, -1)}
                    title={lang === "ru" ? "Влево" : "Солға"}
                    className="rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-black cursor-pointer"
                  >
                    ←
                  </button>
                )}
                {idx < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 1)}
                    title={lang === "ru" ? "Вправо" : "Оңға"}
                    className="rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-black cursor-pointer"
                  >
                    →
                  </button>
                )}
              </div>
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
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === "ru"
                    ? "Настройка фото перед добавлением"
                    : "Фотоны реттеп қосу"}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === "ru"
                    ? "Выберите формат или оставьте фото без обрезки"
                    : "Форматты таңдаңыз немесе фотоны қимай сол күйінде қалдырыңыз"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCropModal}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Формат таңдау */}
            <div className="flex flex-wrap gap-1.5">
              {ASPECT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setAspectMode(opt.id);
                    setOffset({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    aspectMode === opt.id
                      ? "bg-[#003366] text-white border-[#003366]"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {lang === "ru" ? opt.ru : opt.kk}
                </button>
              ))}
            </div>

            {/* Суретті толық көрсететін аймақ */}
            <div className="w-full rounded-xl bg-slate-900 p-3 flex items-center justify-center overflow-hidden">
              <div
                ref={frameRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                style={previewFrameStyle}
                className="relative overflow-hidden rounded-lg border border-white/25 bg-slate-950 select-none touch-none cursor-grab active:cursor-grabbing flex items-center justify-center"
              >
                <img
                  ref={imgRef}
                  src={cropSrc}
                  alt="Preview"
                  draggable={false}
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: "center center",
                  }}
                  className="max-w-full max-h-full object-contain pointer-events-none"
                />
              </div>
            </div>

            {/* Масштаб */}
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

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeCropModal}
                disabled={uploading}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {lang === "ru" ? "Отмена" : "Болдырмау"}
              </button>

              <button
                type="button"
                onClick={handleKeepOriginal}
                disabled={uploading}
                className="rounded-xl border border-[#003366] text-[#003366] hover:bg-blue-50 disabled:opacity-60 px-4 py-2 text-xs font-bold cursor-pointer"
              >
                {uploading
                  ? lang === "ru"
                    ? "Загрузка..."
                    : "Жүктелуде..."
                  : lang === "ru"
                  ? "Без обрезки (оригинал)"
                  : "Қимай сол күйінде қосу"}
              </button>

              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={uploading}
                className="rounded-xl bg-[#003366] hover:bg-[#002244] disabled:opacity-60 px-5 py-2 text-xs font-bold text-white cursor-pointer"
              >
                {uploading
                  ? lang === "ru"
                    ? "Сохранение..."
                    : "Сақталуда..."
                  : lang === "ru"
                  ? "Сохранить кадр"
                  : "Реттелген кадрды қосу"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}