"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLanguage, type Lang } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

export type ArticleDetail = {
  id: number | string;
  slug: string;
  title: string;
  date: string;
  category: string;
  author?: string | null;
  image?: string | null;
  images?: string[] | null;
  summary?: string | null;
  content: string[] | string | null;
};

const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: "kk", label: "ҚАЗ" },
  { code: "ru", label: "РУС" },
  { code: "en", label: "ENG" },
];

const TEXTS = {
  kk: {
    logoAlt: "Әл-Фараби атындағы ҚазҰУ логотипі",
    backHome: "Басты бетке қайту",
    copyLink: "Сілтемені көшіру",
    copied: "✓ Көшірілді",
    printPdf: "Басып шығару / PDF",
    lightMode: "Күндізгі",
    darkMode: "Түнгі",
    loading: "Жүктелуде...",
    notFoundTitle: "Мақала табылмады",
    notFoundDesc:
      "Сұралған мақала жойылған немесе сілтеме қате болуы мүмкін.",
    goHome: "Басты бетке өту",
    readTime: (mins: number) => `~${mins} мин оқу`,
    authorLabel: "Авторы:",
    close: "Жабу ✕",
    prevPhoto: "← Алдыңғы",
    nextPhoto: "Келесі →",
  },
  ru: {
    logoAlt: "Логотип КазНУ им. аль-Фараби",
    backHome: "На главную страницу",
    copyLink: "Скопировать ссылку",
    copied: "✓ Скопировано",
    printPdf: "Печать / PDF",
    lightMode: "Светлая",
    darkMode: "Тёмная",
    loading: "Загрузка...",
    notFoundTitle: "Статья не найдена",
    notFoundDesc:
      "Запрашиваемая статья могла быть удалена или указана неверная ссылка.",
    goHome: "На главную",
    readTime: (mins: number) => `~${mins} мин чтения`,
    authorLabel: "Автор:",
    close: "Закрыть ✕",
    prevPhoto: "← Назад",
    nextPhoto: "Далее →",
  },
  en: {
    logoAlt: "Al-Farabi Kazakh National University logo",
    backHome: "Back to home",
    copyLink: "Copy link",
    copied: "✓ Copied",
    printPdf: "Print / PDF",
    lightMode: "Light",
    darkMode: "Dark",
    loading: "Loading...",
    notFoundTitle: "Article not found",
    notFoundDesc:
      "The requested article may have been removed or the link is invalid.",
    goHome: "Go to home",
    readTime: (mins: number) => `~${mins} min read`,
    authorLabel: "Author:",
    close: "Close ✕",
    prevPhoto: "← Prev",
    nextPhoto: "Next →",
  },
};

export default function ArticleClientView({
  slug,
  initialArticle,
}: {
  slug: string;
  initialArticle: ArticleDetail | null;
}) {
  const { lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const t = TEXTS[lang];

  const [article, setArticle] = useState<ArticleDetail | null>(initialArticle);
  const [loading, setLoading] = useState(!initialArticle);
  const [notFoundState, setNotFoundState] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialArticle) {
      setArticle(initialArticle);
      setLoading(false);
      return;
    }

    async function loadArticle() {
      if (!slug) return;
      setLoading(true);
      setNotFoundState(false);

      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        setNotFoundState(true);
        setArticle(null);
      } else {
        setArticle(data);
      }
      setLoading(false);
    }

    loadArticle();
  }, [slug, initialArticle]);

  const galleryImages = useMemo(() => {
    if (!article) return [];
    const list: string[] = [];
    if (Array.isArray(article.images)) {
      for (const item of article.images) {
        if (typeof item === "string" && item.trim() && !list.includes(item.trim())) {
          list.push(item.trim());
        }
      }
    }
    if (
      typeof article.image === "string" &&
      article.image.trim() &&
      !list.includes(article.image.trim())
    ) {
      list.unshift(article.image.trim());
    }
    return list.slice(0, 4);
  }, [article]);

  const paragraphs = useMemo(() => {
    if (!article?.content) return [];
    if (Array.isArray(article.content)) {
      return article.content.filter(
        (p) => typeof p === "string" && p.trim() !== ""
      );
    }
    if (typeof article.content === "string") {
      return article.content
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean);
    }
    return [];
  }, [article]);

  const readingMinutes = useMemo(() => {
    const fullText = [article?.summary ?? "", ...paragraphs].join(" ");
    const words = fullText.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 180));
  }, [article, paragraphs]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  const galleryGridClass =
    galleryImages.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <main className="max-w-3xl mx-auto py-8 sm:py-10 px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-7 print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs font-bold text-[#003366] dark:text-amber-300 hover:border-[#003366] dark:hover:border-amber-400 transition shadow-2xs"
          >
            <img
              src="/kaznu-logo.png"
              alt={t.logoAlt}
              className="w-5 h-5 object-contain rounded-xs shrink-0"
            />
            <span>← {t.backHome}</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full bg-slate-200/80 dark:bg-slate-800 p-0.5">
              {LANG_OPTIONS.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLang(item.code)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                    lang === item.code
                      ? "bg-[#003366] dark:bg-amber-400 text-white dark:text-slate-950 shadow-2xs"
                      : "text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              {theme === "dark" ? `☀️ ${t.lightMode}` : `🌙 ${t.darkMode}`}
            </button>

            {article && (
              <>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  {copied ? t.copied : t.copyLink}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-full bg-[#003366] dark:bg-amber-400 hover:bg-[#002244] dark:hover:bg-amber-300 px-3.5 py-1.5 text-xs font-bold text-white dark:text-slate-950 transition cursor-pointer shadow-xs"
                >
                  {t.printPdf}
                </button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-500 dark:text-slate-400">
            {t.loading}
          </div>
        ) : notFoundState || !article ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {t.notFoundTitle}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-5">
              {t.notFoundDesc}
            </p>
            <Link
              href="/"
              className="inline-block rounded-full bg-[#003366] dark:bg-amber-400 text-white dark:text-slate-950 px-5 py-2 text-xs font-bold"
            >
              {t.goHome}
            </Link>
          </div>
        ) : (
          <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="bg-blue-50 dark:bg-sky-950/70 text-[#003366] dark:text-sky-300 font-semibold px-2.5 py-1 rounded-full">
                {article.category}
              </span>
              <span>• {article.date}</span>
              <span>• {t.readTime(readingMinutes)}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3 leading-tight">
              {article.title}
            </h1>

            {article.author && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2.5">
                {t.authorLabel}{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {article.author}
                </span>
              </p>
            )}

            {galleryImages.length > 0 && (
              <div className={`grid ${galleryGridClass} gap-4 my-6`}>
                {galleryImages.map((src, idx) => (
                  <button
                    key={`${src}-${idx}`}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className="group relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-left cursor-pointer focus:outline-none"
                  >
                    <img
                      src={src}
                      alt={`${article.title} — ${idx + 1}`}
                      className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4 text-slate-800 dark:text-slate-200 leading-relaxed text-base">
              {paragraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </article>
        )}
      </main>

      {activePhotoIndex !== null && galleryImages[activePhotoIndex] && (
        <div
          onClick={() => setActivePhotoIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full space-y-3"
          >
            <div className="flex items-center justify-between text-white text-sm">
              <span>
                {activePhotoIndex + 1} / {galleryImages.length}
              </span>
              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 cursor-pointer"
              >
                {t.close}
              </button>
            </div>

            <img
              src={galleryImages[activePhotoIndex]}
              alt={`${article?.title || "Photo"} — ${activePhotoIndex + 1}`}
              className="w-full max-h-[78vh] object-contain rounded-xl bg-black"
            />

            {galleryImages.length > 1 && (
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIndex((prev) =>
                      prev === null
                        ? 0
                        : (prev - 1 + galleryImages.length) % galleryImages.length
                    )
                  }
                  className="px-4 py-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 cursor-pointer"
                >
                  {t.prevPhoto}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIndex((prev) =>
                      prev === null ? 0 : (prev + 1) % galleryImages.length
                    )
                  }
                  className="px-4 py-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 cursor-pointer"
                >
                  {t.nextPhoto}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}