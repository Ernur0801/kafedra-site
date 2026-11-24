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
  views?: number | null;
};

const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: "kk", label: "ҚАЗ" },
  { code: "ru", label: "РУС" },
  { code: "en", label: "ENG" },
];

const TEXTS = {
  kk: {
    faculty: "ӘЛ-ФАРАБИ АТЫНДАҒЫ ҚАЗҰУ",
    facultySub: "ФИЛОЛОГИЯ ФАКУЛЬТЕТІ",
    deptTitle: "Орыс филологиясы және әлем әдебиеті",
    deptLabel: "КАФЕДРАСЫ",
    deptSubtitle:
      "Ғылым, тіл және әдебиет тоғысқан кеңістік. Академиялық жаңалықтар, ғылыми жетістіктер және кафедра өмірінен маңызды жарияланымдар.",
    explore: "Жарияланымдарды қарау",
    featured: "ТАҢДАУЛЫ ЖАРИЯЛАНЫМ",
    latest: "СОҢҒЫ ЖАРИЯЛАНЫМДАР",
    allArticles: "Барлық мақалалар",
    searchPlaceholder: "Мақала, автор немесе тақырып бойынша іздеу...",
    allCategories: "Барлығы",
    foundCount: (count: number) => `${count} жарияланым табылды`,
    resetFilter: "Сүзгіні тазарту",
    newBadge: "ЖАҢА",
    readMore: "Толық оқу",
    loading: "Жарияланымдар жүктелуде...",
    empty: "Сұранысыңызға сәйкес мақалалар табылмады.",
    lightMode: "Күндізгі режим",
    darkMode: "Түнгі режим",
    adminBtn: "Басқару",
    about: "БІЗ ТУРАЛЫ",
    aboutText:
      "Орыс филологиясы және әлем әдебиеті кафедрасы — тіл білімі, әдебиеттану және ғылыми-әдістемелік бағыттар бойынша академиялық қызмет атқаратын университеттік орта.",
    footerFaculty: "Филология факультеті",
    footerCopy: "© 2026 Әл-Фараби атындағы Қазақ ұлттық университеті",
    academic: "ҒЫЛЫМ • БІЛІМ • ӘДЕБИЕТ",
    viewsLabel: (n: number) => `${n} қаралым`,
  },
  ru: {
    faculty: "КАЗНУ ИМЕНИ АЛЬ-ФАРАБИ",
    facultySub: "ФИЛОЛОГИЧЕСКИЙ ФАКУЛЬТЕТ",
    deptTitle: "Русская филология и мировая литература",
    deptLabel: "КАФЕДРА",
    deptSubtitle:
      "Пространство науки, языка и литературы. Академические новости, научные достижения и важные публикации из жизни кафедры.",
    explore: "Смотреть публикации",
    featured: "ИЗБРАННАЯ ПУБЛИКАЦИЯ",
    latest: "ПОСЛЕДНИЕ ПУБЛИКАЦИИ",
    allArticles: "Все статьи",
    searchPlaceholder: "Поиск по статье, автору или теме...",
    allCategories: "Все",
    foundCount: (count: number) => `Найдено публикаций: ${count}`,
    resetFilter: "Сбросить фильтр",
    newBadge: "НОВОЕ",
    readMore: "Читать полностью",
    loading: "Загрузка публикаций...",
    empty: "По вашему запросу статьи не найдены.",
    lightMode: "Светлая тема",
    darkMode: "Тёмная тема",
    adminBtn: "Управление",
    about: "О КАФЕДРЕ",
    aboutText:
      "Кафедра русской филологии и мировой литературы — академическая среда, объединяющая языкознание, литературоведение и научно-методическую деятельность.",
    footerFaculty: "Филологический факультет",
    footerCopy: "© 2026 Казахский национальный университет имени аль-Фараби",
    academic: "НАУКА • ОБРАЗОВАНИЕ • ЛИТЕРАТУРА",
    viewsLabel: (n: number) => `${n} просмотров`,
  },
  en: {
    faculty: "AL-FARABI KAZAKH NATIONAL UNIVERSITY",
    facultySub: "FACULTY OF PHILOLOGY",
    deptTitle: "Russian Philology and World Literature",
    deptLabel: "DEPARTMENT",
    deptSubtitle:
      "Where science, language and literature meet. Academic news, research achievements and important stories from the department.",
    explore: "Explore publications",
    featured: "FEATURED PUBLICATION",
    latest: "LATEST PUBLICATIONS",
    allArticles: "All articles",
    searchPlaceholder: "Search by article, author or topic...",
    allCategories: "All",
    foundCount: (count: number) => `${count} publications found`,
    resetFilter: "Reset filters",
    newBadge: "NEW",
    readMore: "Read full article",
    loading: "Loading publications...",
    empty: "No articles match your search.",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    adminBtn: "Management",
    about: "ABOUT THE DEPARTMENT",
    aboutText:
      "The Department of Russian Philology and World Literature is an academic environment bringing together linguistics, literary studies and research methodology.",
    footerFaculty: "Faculty of Philology",
    footerCopy: "© 2026 Al-Farabi Kazakh National University",
    academic: "SCIENCE • EDUCATION • LITERATURE",
    viewsLabel: (n: number) => `${n} views`,
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
        .select("id, slug, title, date, category, author, image, summary, views")
        .order("id", { ascending: false });

      if (!error && data) {
        setArticles(data as ArticleItem[]);
      } else if (error) {
        console.error("Articles loading error:", error.message);
      }

      setLoading(false);
    }

    loadArticles();
  }, []);

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
        (article.author || "").toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  const hasActiveFilter =
    searchQuery.trim() !== "" || selectedCategory !== "ALL";

  const featuredArticle =
    !hasActiveFilter && filteredArticles.length > 0
      ? filteredArticles[0]
      : null;

  const galleryArticles = featuredArticle
    ? filteredArticles.filter((a) => a.id !== featuredArticle.id)
    : filteredArticles;

  const latestArticleId = articles.length > 0 ? articles[0].id : null;

  function handleResetFilters() {
    setSearchQuery("");
    setSelectedCategory("ALL");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f7f9] dark:bg-[#090e18] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* HEADER */}
      <header className="relative z-20 bg-[#082d50] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="min-h-[86px] flex flex-wrap items-center justify-between gap-4 py-4">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/kaznu-logo.png"
                alt={t.faculty}
                className="w-12 h-12 md:w-14 md:h-14 object-contain bg-white rounded-xl p-1.5 shadow-lg"
              />

              <div>
                <p className="text-[11px] md:text-xs font-bold tracking-[0.13em] text-amber-300">
                  {t.faculty}
                </p>
                <p className="text-[10px] tracking-[0.2em] text-blue-100/70 mt-1">
                  {t.facultySub}
                </p>
              </div>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-full bg-white/10 border border-white/15 p-1">
                {LANG_OPTIONS.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLang(item.code)}
                    className={`rounded-full px-3 py-2 text-[11px] font-bold transition-all ${
                      lang === item.code
                        ? "bg-amber-400 text-[#082d50] shadow"
                        : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? t.lightMode : t.darkMode}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs hover:bg-white/20 transition"
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>

              <Link
                href="/admin"
                className="rounded-full bg-amber-400 hover:bg-amber-300 text-[#082d50] px-4 py-2.5 text-xs font-extrabold transition shadow-lg shadow-black/10"
              >
                + {t.adminBtn}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#082d50] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(36,112,164,0.35),transparent_45%),linear-gradient(120deg,#082d50,#0c416d)]" />

        <div className="absolute -right-32 -top-40 w-[550px] h-[550px] rounded-full border border-white/[0.07]" />
        <div className="absolute -right-16 -top-24 w-[400px] h-[400px] rounded-full border border-white/[0.07]" />

        <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-16 pb-16 md:pt-24 md:pb-24">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-7">
              <span className="w-10 h-[2px] bg-amber-400" />
              <span className="text-amber-300 text-[11px] sm:text-xs font-bold tracking-[0.22em]">
                {t.academic}
              </span>
            </div>

            <p className="text-blue-200/80 text-xs md:text-sm font-semibold tracking-[0.15em] mb-4">
              {t.deptLabel}
            </p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold leading-[1.08] tracking-tight">
              {t.deptTitle}
              <span className="text-amber-400">.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-sm md:text-base lg:text-lg text-blue-100/80 leading-8">
              {t.deptSubtitle}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="#publications"
                className="inline-flex items-center gap-3 rounded-full bg-amber-400 hover:bg-amber-300 text-[#082d50] px-6 py-3.5 text-sm font-extrabold transition shadow-xl shadow-black/10"
              >
                {t.explore}
                <span className="text-lg">↓</span>
              </a>

              <div className="flex items-center gap-2 text-xs text-blue-100/60 px-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {t.facultySub}
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 right-8 hidden lg:block opacity-[0.07] pointer-events-none">
            <span className="text-[250px] font-serif font-bold leading-none">
              Ф
            </span>
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-200 to-transparent" />
      </section>

      {/* MAIN */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-12 md:py-16">
          {/* FEATURED ARTICLE */}
          {!loading && featuredArticle && (
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-[2px] bg-amber-500" />
                <p className="text-xs font-extrabold tracking-[0.2em] text-[#17466c] dark:text-amber-400">
                  {t.featured}
                </p>
              </div>

              <article className="group relative grid lg:grid-cols-[1.15fr_0.85fr] overflow-hidden rounded-3xl bg-white dark:bg-[#111c2b] border border-slate-200 dark:border-slate-800 shadow-[0_15px_50px_rgba(15,35,60,0.08)]">
                <Link
                  href={`/articles/${featuredArticle.slug}`}
                  className="relative block min-h-[260px] md:min-h-[380px] overflow-hidden bg-slate-200 dark:bg-slate-800"
                >
                  {featuredArticle.image && (
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                  <div className="absolute bottom-5 left-5">
                    <span className="inline-flex rounded-full bg-amber-400 text-[#082d50] px-3 py-1.5 text-[10px] font-extrabold tracking-wider">
                      {t.featured}
                    </span>
                  </div>
                </Link>

                <div className="flex flex-col justify-center p-7 md:p-10 lg:p-12">
                  <div className="flex flex-wrap items-center gap-3 mb-6 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#17466c] dark:text-blue-300 px-3 py-1.5">
                      {featuredArticle.category}
                    </span>
                    <span>{featuredArticle.date}</span>
                    <span>• 👁 {t.viewsLabel(featuredArticle.views ?? 0)}</span>
                  </div>

                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-slate-900 dark:text-white">
                    {featuredArticle.title}
                  </h2>

                  <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300 line-clamp-4">
                    {featuredArticle.summary}
                  </p>

                  {featuredArticle.author && (
                    <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
                      {featuredArticle.author}
                    </p>
                  )}

                  <div className="mt-8">
                    <Link
                      href={`/articles/${featuredArticle.slug}`}
                      className="inline-flex items-center gap-3 text-sm font-extrabold text-[#17466c] dark:text-amber-400 hover:gap-5 transition-all"
                    >
                      {t.readMore}
                      <span className="text-xl">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            </section>
          )}

          {/* PUBLICATIONS */}
          <section id="publications" className="scroll-mt-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
              <div>
                <p className="text-xs font-extrabold tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-3">
                  ACADEMIC JOURNAL
                </p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#102f4e] dark:text-white">
                  {t.latest}
                </h2>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  {t.foundCount(filteredArticles.length)}
                </p>
              </div>

              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-widest">
                KAZNU · PHILOLOGY
              </div>
            </div>

            {/* SEARCH */}
            <div className="rounded-2xl bg-white dark:bg-[#111c2b] border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5 mb-8">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  ⌕
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0b1422] pl-12 pr-4 py-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/70 transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                {categories.map((cat) => {
                  const active = selectedCategory === cat;
                  const label = cat === "ALL" ? t.allCategories : cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                        active
                          ? "bg-[#0c3a63] text-white dark:bg-amber-400 dark:text-[#082d50] shadow-md"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}

                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="ml-auto text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    {t.resetFilter}
                  </button>
                )}
              </div>
            </div>

            {/* ARTICLES */}
            {loading ? (
              <div className="rounded-2xl bg-white dark:bg-[#111c2b] border border-slate-200 dark:border-slate-800 p-16 text-center text-slate-500">
                {t.loading}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-[#111c2b] border border-slate-200 dark:border-slate-800 p-16 text-center text-slate-500">
                {t.empty}
              </div>
            ) : galleryArticles.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-[#111c2b] border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
                {t.allArticles}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryArticles.map((article) => {
                  const isLatest = article.id === latestArticleId;

                  return (
                    <article
                      key={article.id}
                      className="group flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-[#111c2b] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <Link
                        href={`/articles/${article.slug}`}
                        className="relative block h-56 overflow-hidden bg-slate-200 dark:bg-slate-800"
                      >
                        {article.image && (
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-70" />

                        {isLatest && (
                          <span className="absolute top-4 left-4 rounded-full bg-amber-400 text-[#082d50] px-3 py-1.5 text-[10px] font-extrabold tracking-wider">
                            {t.newBadge}
                          </span>
                        )}
                      </Link>

                      <div className="flex flex-col flex-grow p-6">
                        <div className="flex items-center justify-between gap-2 mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span className="text-[#1b527c] dark:text-blue-300">
                            {article.category}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span>{article.date}</span>
                            <span>• 👁 {article.views ?? 0}</span>
                          </div>
                        </div>

                        <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-white group-hover:text-[#1b527c] dark:group-hover:text-amber-400 transition-colors">
                          <Link href={`/articles/${article.slug}`}>
                            {article.title}
                          </Link>
                        </h3>

                        <p className="mt-3 mb-6 text-sm leading-6 text-slate-500 dark:text-slate-400 line-clamp-3 flex-grow">
                          {article.summary}
                        </p>

                        <Link
                          href={`/articles/${article.slug}`}
                          className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-extrabold text-[#17466c] dark:text-amber-400"
                        >
                          {t.readMore}
                          <span className="text-lg group-hover:translate-x-1 transition-transform">
                            →
                          </span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* ABOUT SECTION */}
          <section className="mt-20 relative overflow-hidden rounded-3xl bg-[#0b3559] text-white p-8 md:p-12 lg:p-16">
            <div className="absolute -right-20 -top-28 w-80 h-80 rounded-full border border-white/10" />
            <div className="absolute -right-10 -top-16 w-60 h-60 rounded-full border border-white/10" />

            <div className="relative max-w-3xl">
              <p className="text-amber-300 text-xs font-extrabold tracking-[0.2em] mb-5">
                KAZNU · PHILOLOGY
              </p>
              <h2 className="text-2xl md:text-3xl font-bold mb-5">
                {t.about}
              </h2>
              <p className="text-sm md:text-base leading-8 text-blue-100/80">
                {t.aboutText}
              </p>
              <div className="mt-8 w-16 h-1 bg-amber-400 rounded-full" />
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#061e35] text-white mt-8">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div className="flex items-start gap-4">
              <img
                src="/kaznu-logo.png"
                alt={t.faculty}
                className="w-14 h-14 object-contain bg-white rounded-xl p-1.5"
              />
              <div>
                <p className="font-bold text-sm tracking-wide">
                  {t.faculty}
                </p>
                <p className="mt-2 text-xs text-blue-200/60">
                  {t.footerFaculty}
                </p>
              </div>
            </div>

            <div className="md:text-right">
              <p className="text-xs font-bold tracking-widest text-amber-300 mb-3">
                {t.about}
              </p>
              <p className="text-xs leading-6 text-blue-100/60 max-w-md md:ml-auto">
                {t.aboutText}
              </p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-[11px] text-blue-100/50">
            <p>{t.footerCopy}</p>
            <p>AL-FARABI KAZNU · PHILOLOGY</p>
          </div>
        </div>
      </footer>
    </div>
  );
}