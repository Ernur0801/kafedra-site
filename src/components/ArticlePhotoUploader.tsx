"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

interface ArticlePhotoUploaderProps {
  images: string[];
  onChange: (urls: string[]) => void;
  maxPhotos?: number;
}

/**
 * Фотоны 16:9 пропорцияға ортасынан қиып (crop) және өлшемін реттеп Blob қайтарады.
 * Осылайша суреттің тек жартысы немесе басы кесіліп қалатын жағдай болмайды.
 */
async function cropImageTo16x9(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const targetRatio = 16 / 9;
      const srcWidth = img.width;
      const srcHeight = img.height;
      const srcRatio = srcWidth / srcHeight;

      let cropWidth = srcWidth;
      let cropHeight = srcHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (srcRatio > targetRatio) {
        // Сурет тым жалпақ — оң/сол жағын тең қиямыз
        cropWidth = srcHeight * targetRatio;
        offsetX = (srcWidth - cropWidth) / 2;
      } else if (srcRatio < targetRatio) {
        // Сурет тым биік — үсті/астын тең қиямыз
        cropHeight = srcWidth / targetRatio;
        offsetY = (srcHeight - cropHeight) / 2;
      }

      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas контексті алынбады"));
        return;
      }

      ctx.drawImage(
        img,
        offsetX,
        offsetY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Суретті қию сәтсіз аяқталды"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.88
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Суретті оқу мүмкін болмады"));
    };

    img.src = url;
  });
}

export default function ArticlePhotoUploader({
  images,
  onChange,
  maxPhotos = 4,
}: ArticlePhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    setErrorMsg(null);

    const remainingSlots = maxPhotos - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg(`Ең көбі ${maxPhotos} сурет қосуға болады.`);
      e.target.value = "";
      return;
    }

    const filesToProcess = Array.from(selected).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToProcess) {
        const croppedBlob = await cropImageTo16x9(file);
        const fileName = `article-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("articles")
          .upload(fileName, croppedBlob, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from("articles").getPublicUrl(fileName);
        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl);
        }
      }

      onChange([...images, ...uploadedUrls]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Сурет жүктеу кезінде қате шықты";
      setErrorMsg(message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">
          Мақала фотолары ({images.length}/{maxPhotos})
        </label>
        <span className="text-xs opacity-70">Автоматты 16:9 қиылады</span>
      </div>

      {images.length < maxPhotos && (
        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 cursor-pointer hover:border-amber-500 transition">
          <span className="text-sm font-medium">
            {uploading
              ? "Сурет қиылып, жүктелуде..."
              : "1–4 фото таңдаңыз (жүйе өзі қиып реттейді)"}
          </span>
          <span className="text-xs opacity-60 mt-1">JPG, PNG, WEBP</span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={handleFilesSelected}
            className="hidden"
          />
        </label>
      )}

      {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative aspect-video rounded-lg overflow-hidden border bg-slate-100 dark:bg-slate-800"
            >
              <img
                src={url}
                alt={`Сурет ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {idx === 0 && (
                <span className="absolute top-1.5 left-1.5 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Негізгі
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1.5 right-1.5 bg-red-600 text-white text-xs px-2 py-0.5 rounded hover:bg-red-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}