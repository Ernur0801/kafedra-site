"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLanguage, type Lang } from "@/context/LanguageContext";

type ArticleItem = {
  id: number | string;
  slug: string;
  title: string;
  date: string;
  category: string;
  author?: string | null;
  image: string;
  summary: string;
};

const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: "kk", label: "ҚАЗ" },
  { code: "ru", label: "РУС" },
  { code: "en", label: "ENG" },
];

const TEXTS = {
  kk: {
    logoAlt: "Әл-Фараби атындағы ҚазҰУ логотипі",
    faculty: "Әл-Фараби атындағы ҚазҰУ • Филология факультеті",
    deptTitle: "Орыс филологиясы және әлем әдебиеті кафедрасы",
    deptSubtitle:
      "Кафедраның имидждік мақалалары, ғылыми-әдістемелік жаңалықтары және баспасөз беттеріндегі жарияланымдар.",
    adminBtn: "+ Мақала қосу / Басқару",
    searchPlaceholder: "Тақырып, автор немесе кілт сөз бойынша іздеу...",
    allCategories: "Барлығы",
    foundCount: (count: number) => `Табылды: ${count} мақала`,
    resetFilter: "Сүзгіні тазарту",
    newBadge: "Жаңа",
    readMore: "Толық оқу →",
    loading: "Мақалалар жүктелуде...",
    empty: "Сұранысқа сәйкес мақалалар табылмады.",
    footerAbout:
      "Орыс филологиясы және әлем әдебиеті кафедрасы — ғылыми-әдістемелік жұмыс, әдебиеттану және тіл білімі бағыттары.",
    footerCopy: "© 2026 Әл-Фараби атындағы ҚазҰУ",
  },
  ru: {
    logoAlt: "Логотип КазНУ им. аль-Фараби",
    faculty: "КазНУ им. аль-Фараби • Филологический факультет",
    deptTitle: "Кафедра русской филологии и мировой литературы",
    deptSubtitle:
      "Имиджевые статьи кафедры, научно-методические новости и публикации в средствах массовой информации.",
    adminBtn: "+ Добавить / Управление",
    searchPlaceholder: "Поиск по заголовку, автору или ключевому слову...",
    allCategories: "Все",
    foundCount: (count: number) => `Найдено статей: ${count}`,
    resetFilter: "Сбросить фильтр",
    newBadge: "Новое",
    readMore: "Читать полностью →",
    loading: "Загрузка статей...",
    empty: "По вашему запросу статьи не найдены.",
    footerAbout:
      "Кафедра русской филологии и мировой литературы — научно-методическая работа, литературоведение и языкознание.",
    footerCopy: "© 2026 КазНУ им. аль-Фараби",
  },
  en: {
    logoAlt: "Al-Farabi Kazakh National University logo",
    faculty: "Al-Farabi KazNU • Faculty of Philology",
    deptTitle: "Department of Russian Philology and World Literature",
    deptSubtitle:
      "Featured department articles, academic and methodological news, and media publications.",
    adminBtn: "+ Add / Manage",
    searchPlaceholder: "Search by title, author, or keyword...",
    allCategories: "All",
    foundCount: (count: number) => `Articles found: ${count}`,
    resetFilter: "Reset filter",
    newBadge: "New",
    readMore: "Read more →",
    loading: "Loading articles...",
    empty: "No articles match your search criteria.",
    footerAbout:
      "Department of Russian Philology and World Literature — academic methodology, literary studies, and linguistics.",
    footerCopy: "© 2026 Al-Farabi Kazakh National University",
  },
};

export default function HomePage() {
  const { lang, setLang } = useLanguage();
  const t = TEXTS[lang];

  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  useEffect(() => {
    async function loadArticles() {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("id, slug, title, date, category, author, image, summary")
        .order("id", { ascending: false });

      if (!error && data) {
        setArticles(data);
      }
      setLoading(false);
    }

    loadArticles();
  }, []);

  const latestArticleId = articles.length > 0 ? articles[0].id : null;

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(articles.map((a) => a.category).filter(Boolean))
    );
    return ["ALL", ...unique];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory =
        selectedCategory === "ALL" || article.category === selectedCategory;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.summary.toLowerCase().includes(q) ||
        (article.author && article.author.toLowerCase().includes(q)) ||
        article.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  const hasActiveFilter =
    searchQuery.trim() !== "" || selectedCategory !== "ALL";

  function handleResetFilters() {
    setSearchQuery("");
    setSelectedCategory("ALL");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Жоғарғы бөлім (Header) */}
      <header className="bg-[#003366] text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
              {t.faculty}
            </p>

            <div className="flex items-center gap-2">
              {/* Тіл ауыстырғыш ҚАЗ / РУС / ENG */}
              <div className="inline-flex rounded-lg bg-white/10 p-0.5 border border-white/20">
                {LANG_OPTIONS.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLang(item.code)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      lang === item.code
                        ? "bg-amber-400 text-slate-950"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition"
              >
                {t.adminBtn}
              </Link>
            </div>
          </div>

          <div className="flex items-start sm:items-center gap-4">
            <img
              src="/kaznu-logo.png"
              alt={t.logoAlt}
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain bg-white rounded-xl p-1.5 shrink-0 shadow-sm"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold leading-snug">
                {t.deptTitle}
              </h1>
              <p className="text-slate-200 text-sm mt-1.5 max-w-2xl">
                {t.deptSubtitle}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Негізгі бөлім */}
      <main className="max-w-5xl w-full mx-auto px-4 py-8 flex-grow">
        {/* Іздеу және санат сүзгісі */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-xs space-y-4">
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#003366]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                const label = cat === "ALL" ? t.allCategories : cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      active
                        ? "bg-[#003366] text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
              >
                {t.resetFilter}
              </button>
            )}
          </div>
        </div>

        {/* Нәтиже саны */}
        {!loading && (
          <div className="mb-4 text-xs font-semibold text-slate-500">
            {t.foundCount(filteredArticles.length)}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl p-10 text-center border border-slate-200 text-slate-500">
            {t.loading}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-slate-200 text-slate-500">
            {t.empty}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {filteredArticles.map((article) => {
              const isLatest = article.id === latestArticleId;
              return (
                <article
                  key={article.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col"
                >
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-56 object-cover"
                  />
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                      <span className="bg-blue-50 text-[#003366] font-semibold px-2.5 py-1 rounded">
                        {article.category}
                      </span>
                      <span>{article.date}</span>
                      {isLatest && (
                        <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                          {t.newBadge}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 mb-3 leading-snug">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="hover:text-[#003366] transition"
                      >
                        {article.title}
                      </Link>
                    </h2>

                    <p className="text-slate-600 text-sm mb-5 line-clamp-3 flex-grow">
                      {article.summary}
                    </p>

                    <Link
                      href={`/articles/${article.slug}`}
                      className="inline-flex items-center text-sm font-semibold text-[#003366] hover:text-amber-600 transition"
                    >
                      {t.readMore}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Төменгі бөлім (Footer) */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 px-4 text-center text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-600">{t.footerAbout}</p>
        <p>{t.footerCopy}</p>
      </footer>
    </div>
  );
}