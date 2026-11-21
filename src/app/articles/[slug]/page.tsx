"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";

type ArticleDetail = {
  id: number | string;
  slug: string;
  title: string;
  date: string;
  category: string;
  author?: string | null;
  image?: string | null;
  summary?: string | null;
  content: string[] | string | null;
};

const TEXTS = {
  kk: {
    backHome: "← Басты бетке қайту",
    copyLink: "Сілтемені көшіру",
    copied: "✓ Сілтеме көшірілді",
    printPdf: "Басып шығару / PDF",
    loading: "Жүктелуде...",
    notFoundTitle: "Мақала табылмады",
    notFoundDesc:
      "Сұралған мақала жойылған немесе сілтеме қате болуы мүмкін.",
    goHome: "Басты бетке өту",
    readTime: (mins: number) => `~${mins} мин оқу`,
    authorLabel: "Авторы:",
  },
  ru: {
    backHome: "← На главную страницу",
    copyLink: "Скопировать ссылку",
    copied: "✓ Ссылка скопирована",
    printPdf: "Печать / PDF",
    loading: "Загрузка...",
    notFoundTitle: "Статья не найдена",
    notFoundDesc:
      "Запрашиваемая статья могла быть удалена или указана неверная ссылка.",
    goHome: "На главную",
    readTime: (mins: number) => `~${mins} мин чтения`,
    authorLabel: "Автор:",
  },
};

function ArticleContent() {
  const { lang, setLang } = useLanguage();
  const t = TEXTS[lang];

  const params = useParams<{ slug: string }>();
  const rawSlug = params?.slug ?? "";
  const slug = decodeURIComponent(rawSlug);

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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
  }, [slug]);

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

  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
        <Link
          href="/"
          className="text-sm font-medium text-[#003366] hover:underline"
        >
          {t.backHome}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setLang("kk")}
              className={`px-2 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                lang === "kk"
                  ? "bg-[#003366] text-white"
                  : "text-slate-700 hover:bg-slate-200"
              }`}
            >
              ҚАЗ
            </button>
            <button
              type="button"
              onClick={() => setLang("ru")}
              className={`px-2 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                lang === "ru"
                  ? "bg-[#003366] text-white"
                  : "text-slate-700 hover:bg-slate-200"
              }`}
            >
              РУС
            </button>
          </div>

          {article && (
            <>
              <button
                type="button"
                onClick={handleCopyLink}
                className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                {copied ? t.copied : t.copyLink}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-lg bg-[#003366] hover:bg-[#002244] px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
              >
                {t.printPdf}
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">{t.loading}</p>
      ) : notFoundState || !article ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t.notFoundTitle}
          </h1>
          <p className="text-slate-600 text-sm mb-4">{t.notFoundDesc}</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-[#003366] text-white px-4 py-2 text-sm font-semibold"
          >
            {t.goHome}
          </Link>
        </div>
      ) : (
        <article>
          <p className="text-sm text-slate-500">
            {article.date} • {article.category} • {t.readTime(readingMinutes)}
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-2 leading-tight">
            {article.title}
          </h1>

          {article.author && (
            <p className="text-sm text-slate-600 mt-2">
              {t.authorLabel}{" "}
              <span className="font-medium">{article.author}</span>
            </p>
          )}

          {article.image && (
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-72 object-cover rounded-xl my-6"
            />
          )}

          <div className="space-y-4 text-slate-800 leading-relaxed">
            {paragraphs.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </article>
      )}
    </main>
  );
}

export default function ArticlePage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-3xl mx-auto py-10 px-4 text-slate-500">
          Жүктелуде...
        </main>
      }
    >
      <ArticleContent />
    </Suspense>
  );
}