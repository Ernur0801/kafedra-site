import React, { Suspense } from "react";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import ArticleClientView, { type ArticleDetail } from "./ArticleClientView";

async function fetchArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  if (!slug) return null;
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data as ArticleDetail;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const article = await fetchArticleBySlug(slug);

  if (!article) {
    return {
      title: "Мақала табылмады",
      description:
        "Сұралған мақала табылмады — Орыс филологиясы және әлем әдебиеті кафедрасы.",
    };
  }

  const description =
    article.summary?.trim() ||
    `${article.title} — Орыс филологиясы және әлем әдебиеті кафедрасы.`;
  const imageUrl = article.image?.trim() || "/kaznu-logo.png";

  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
      images: [
        {
          url: imageUrl,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [imageUrl],
    },
  };
}

async function ArticleLoader({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const initialArticle = await fetchArticleBySlug(slug);

  return <ArticleClientView slug={slug} initialArticle={initialArticle} />;
}

export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="max-w-3xl mx-auto py-10 px-4 text-slate-500">
          Жүктелуде...
        </main>
      }
    >
      <ArticleLoader params={params} />
    </Suspense>
  );
}