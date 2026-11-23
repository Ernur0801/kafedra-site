"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLanguage, type Lang } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

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
    readMore: "Толық оқу",
    loading: "Мақалалар жүктелуде...",
    empty: "Сұранысыңызға сәйкес мақалалар табылмады.",
    lightMode: "Күндізгі",
    darkMode: "Түнгі",
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
    readMore: "Читать полностью",
    loading: "Загрузка статей...",
    empty: "По вашему запросу статьи не найдены.",
    lightMode: "Светлая",
    darkMode: "Тёмная",
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
    readMore: "Read more",
    loading: "Loading articles...",
    empty: "No articles match your search criteria.",
    lightMode: "Light",
    darkMode: "Dark",
    footerAbout:
      "Department of Russian Philology and World Literature — academic methodology, literary studies, and linguistics.",
    footerCopy: "© 2026 Al-Farabi Kazakh National University",
  },
};

export default function HomePage() {
  const { lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Жоғарғы бөлім (Modern Header) */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#002244] via-[#003366] to-[#0a4b8c] text-white shadow-lg">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-300/10 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 py-8 md:py-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <img
                src="/kaznu-logo.png"
                alt={t.logoAlt}
                className="w-11 h-11 md:w-12 md:h-12 object-contain bg-white rounded-xl p-1 shadow-sm ring-1 ring-white/30 shrink-0"
              />
              <p className="text-amber-300 text-xs font-semibold uppercase tracking-wider">
                {t.faculty}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Тіл ауыстырғыш ҚАЗ / РУС / ENG */}
              <div className="inline-flex rounded-full bg-white/10 backdrop-blur-md p-1 border border-white/15">
                {LANG_OPTIONS.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLang(item.code)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      lang === item.code
                        ? "bg-amber-400 text-slate-950 shadow-sm"
                        : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Dark / Light mode батырмасы */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? t.lightMode : t.darkMode}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
              >
                <span>{theme === "dark" ? "☀️" : "🌙"}</span>
                <span>{theme === "dark" ? t.lightMode : t.darkMode}</span>
              </button>

              {/* Админ батырмасы */}
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-1.5 text-xs font-bold shadow-sm transition"
              >
                {t.adminBtn}
              </Link>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight max-w-3xl">
            {t.deptTitle}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-200/90 max-w-2xl leading-relaxed">
            {t.deptSubtitle}
          </p>
        </div>
      </header>

      {/* Негізгі бөлім */}
      <main className="max-w-5xl w-full mx-auto px-4 py-8 flex-grow">
        {/* Іздеу және рубрика сүзгісі */}
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/70 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#003366] dark:focus:ring-amber-400/60 transition"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                const label = cat === "ALL" ? t.allCategories : cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      active
                        ? "bg-[#003366] dark:bg-amber-400 text-white dark:text-slate-950 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
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
                className="text-xs font-semibold text-[#003366] dark:text-amber-400 hover:underline cursor-pointer"
              >
                {t.resetFilter}
              </button>
            )}
          </div>
        </div>

        {/* Нәтиже саны */}
        {!loading && (
          <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t.foundCount(filteredArticles.length)}
          </div>
        )}

        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
            {t.loading}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
            {t.empty}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredArticles.map((article) => {
              const isLatest = article.id === latestArticleId;
              return (
                <article
                  key={article.id}
                  className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  <Link
                    href={`/articles/${article.slug}`}
                    className="block overflow-hidden"
                  >
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-56 object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </Link>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <span className="bg-blue-50 dark:bg-sky-950/70 text-[#003366] dark:text-sky-300 font-semibold px-2.5 py-1 rounded-full">
                        {article.category}
                      </span>
                      <span>{article.date}</span>
                      {isLatest && (
                        <span className="bg-amber-100 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 font-bold px-2.5 py-0.5 rounded-full">
                          {t.newBadge}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2.5 leading-snug">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="hover:text-[#003366] dark:hover:text-amber-400 transition"
                      >
                        {article.title}
                      </Link>
                    </h2>

                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 line-clamp-3 flex-grow leading-relaxed">
                      {article.summary}
                    </p>

                    <div>
                      <Link
                        href={`/articles/${article.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-[#003366] dark:hover:bg-amber-400 text-slate-800 dark:text-slate-100 hover:text-white dark:hover:text-slate-950 px-4 py-2 text-xs font-bold transition"
                      >
                        <span>{t.readMore}</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Төменгі бөлім (Footer) */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-14 py-7 px-4 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          {t.footerAbout}
        </p>
        <p>{t.footerCopy}</p>
      </footer>
    </div>
  );
}