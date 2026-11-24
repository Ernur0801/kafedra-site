"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import ArticlePhotoUploader from "@/components/ArticlePhotoUploader";
import type { CollageLayoutType } from "@/components/ArticleGallery";

type AdminAccount = {
  id: string;
  fullName: string;
  username: string;
  password: string;
};

const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: "nurayim",
    fullName: "Жеңіс Нұрайым Нұрхатқызы",
    username: "nurayim.zhenis",
    password: "Nurayim#2026",
  },
  {
    id: "ernur",
    fullName: "Берік Ернұр Берікұлы",
    username: "ernur.berik",
    password: "Ernur#2026",
  },
  {
    id: "alena",
    fullName: "Демченко Алёна Сергеевна",
    username: "alena.demchenko",
    password: "Alena#2026",
  },
];

const AUTH_STORAGE_KEY = "kafedra_admin_user_v1";
const MAX_PHOTOS = 4;

type ArticleRecord = {
  id: number | string;
  slug: string;
  title: string;
  date: string;
  category: string;
  author?: string | null;
  image?: string | null;
  images?: string[] | null;
  collage_layout?: CollageLayoutType | string | null;
  summary: string;
  content: string[] | string | null;
  views?: number | null;
};

const COLLAGE_OPTIONS: {
  value: CollageLayoutType;
  kk: string;
  ru: string;
}[] = [
  { value: "auto", kk: "Автоматты коллаж", ru: "Авто-коллаж" },
  {
    value: "hero_stack",
    kk: "1 үлкен + қалғаны қатар",
    ru: "1 крупное + остальные сбоку",
  },
  { value: "grid2", kk: "2 бағанды тор", ru: "Сетка в 2 колонки" },
  { value: "row", kk: "Біртұтас қатар", ru: "В один ряд" },
];

const PRESET_IMAGES = [
  {
    kk: "Кітапхана / Ғылым",
    ru: "Библиотека / Наука",
    url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=900",
  },
  {
    kk: "Университет / Дәрісхана",
    ru: "Университет / Аудитория",
    url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900",
  },
  {
    kk: "Конференция / Кездесу",
    ru: "Конференция / Встреча",
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900",
  },
];

function makeSlug(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яёәіңғүұқөһ0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base || "article"}-${suffix}`;
}

export default function AdminPage() {
  const { lang, setLang } = useLanguage();

  const [currentAdmin, setCurrentAdmin] = useState<AdminAccount | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("24.11.2026");
  const [category, setCategory] = useState("Кафедра жаңалықтары");
  const [author, setAuthor] = useState("");
  const [images, setImages] = useState<string[]>([PRESET_IMAGES[0].url]);
  const [collageLayout, setCollageLayout] = useState<CollageLayoutType>("auto");
  const [summary, setSummary] = useState("");
  const [contentText, setContentText] = useState("");

  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const [articles, setArticles] = useState<ArticleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedId = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (savedId) {
        const found = ADMIN_ACCOUNTS.find((acc) => acc.id === savedId) || null;
        setCurrentAdmin(found);
      }
    } catch {
      // ignore storage errors
    } finally {
      setAuthChecked(true);
    }
  }, []);

  async function fetchArticles() {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setArticles(data as ArticleRecord[]);
    }
  }

  useEffect(() => {
    if (currentAdmin) {
      fetchArticles();
    }
  }, [currentAdmin]);

  const totalViews = useMemo(() => {
    return articles.reduce((sum, item) => sum + (item.views ?? 0), 0);
  }, [articles]);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);

    const normalizedLogin = loginInput.trim().toLowerCase();
    const matched = ADMIN_ACCOUNTS.find(
      (acc) =>
        acc.username.toLowerCase() === normalizedLogin &&
        acc.password === passInput.trim()
    );

    if (matched) {
      setCurrentAdmin(matched);
      setLoginInput("");
      setPassInput("");
      try {
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, matched.id);
      } catch {
        // ignore storage errors
      }
    } else {
      setAuthError(
        lang === "kk"
          ? "Логин немесе құпиясөз қате. Қайта теріп көріңіз."
          : "Неверный логин или пароль. Попробуйте ещё раз."
      );
    }
  }

  function handleLogout() {
    setCurrentAdmin(null);
    setLoginInput("");
    setPassInput("");
    setAuthError(null);
    try {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }

  function resetForm() {
    setEditingId(null);
    setEditingSlug(null);
    setTitle("");
    setDate("24.11.2026");
    setCategory(lang === "kk" ? "Кафедра жаңалықтары" : "Новости кафедры");
    setAuthor("");
    setImages([PRESET_IMAGES[0].url]);
    setCollageLayout("auto");
    setSummary("");
    setContentText("");
  }

  function handleStartEdit(item: ArticleRecord) {
    setMessage(null);
    setErrorMsg(null);
    setEditingId(item.id);
    setEditingSlug(item.slug);
    setTitle(item.title || "");
    setDate(item.date || "24.11.2026");
    setCategory(item.category || "Кафедра жаңалықтары");
    setAuthor(item.author || "");

    const combined: string[] = [];
    if (Array.isArray(item.images)) {
      combined.push(...item.images.filter(Boolean));
    }
    if (item.image && !combined.includes(item.image)) {
      combined.unshift(item.image);
    }
    setImages(
      combined.length > 0 ? combined.slice(0, MAX_PHOTOS) : [PRESET_IMAGES[0].url]
    );

    const layoutVal = item.collage_layout;
    if (
      layoutVal === "auto" ||
      layoutVal === "grid2" ||
      layoutVal === "hero_stack" ||
      layoutVal === "row"
    ) {
      setCollageLayout(layoutVal);
    } else {
      setCollageLayout("auto");
    }

    setSummary(item.summary || "");

    if (Array.isArray(item.content)) {
      setContentText(item.content.join("\n\n"));
    } else if (typeof item.content === "string") {
      setContentText(item.content);
    } else {
      setContentText("");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: number | string, articleTitle: string) {
    const confirmed = window.confirm(
      lang === "kk"
        ? `«${articleTitle}» мақаласын расында өшіргіңіз келе ме?`
        : `Вы действительно хотите удалить статью «${articleTitle}»?`
    );
    if (!confirmed) return;

    setMessage(null);
    setErrorMsg(null);

    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) {
      setErrorMsg(
        lang === "kk"
          ? `Өшіру кезінде қате шықты: ${error.message}`
          : `Ошибка при удалении: ${error.message}`
      );
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    setMessage(lang === "kk" ? "Мақала өшірілді." : "Статья удалена.");
    await fetchArticles();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setErrorMsg(null);

    if (!title.trim() || !summary.trim() || !contentText.trim()) {
      setErrorMsg(
        lang === "kk"
          ? "Тақырыпты, қысқаша сипаттаманы және мақала мәтінін толтырыңыз."
          : "Заполните заголовок, краткое описание и текст статьи."
      );
      return;
    }

    const paragraphs = contentText
      .split(/\n\s*\n|\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    const finalImages = images.filter(Boolean).slice(0, MAX_PHOTOS);
    const mainImage = finalImages[0] || PRESET_IMAGES[0].url;

    setLoading(true);

    const basePayload = {
      title: title.trim(),
      date: date.trim() || "2026",
      category:
        category.trim() || (lang === "kk" ? "Жаңалықтар" : "Новости"),
      author:
        author.trim() ||
        currentAdmin?.fullName ||
        (lang === "kk" ? "Кафедра" : "Кафедра"),
      image: mainImage,
      images: finalImages,
      collage_layout: collageLayout,
      summary: summary.trim(),
      content: paragraphs,
    };

    if (editingId !== null) {
      let { error } = await supabase
        .from("articles")
        .update({ ...basePayload, slug: editingSlug || makeSlug(title) })
        .eq("id", editingId);

      if (
        error &&
        (error.message.toLowerCase().includes("images") ||
          error.message.toLowerCase().includes("collage_layout"))
      ) {
        const { images: _i, collage_layout: _c, ...fallbackPayload } =
          basePayload;
        const retry = await supabase
          .from("articles")
          .update({ ...fallbackPayload, slug: editingSlug || makeSlug(title) })
          .eq("id", editingId);
        error = retry.error;
      }

      setLoading(false);

      if (error) {
        setErrorMsg(
          lang === "kk"
            ? `Жаңарту кезінде қате шықты: ${error.message}`
            : `Ошибка при обновлении: ${error.message}`
        );
        return;
      }

      setMessage(
        lang === "kk" ? "Мақала сәтті жаңартылды!" : "Статья успешно обновлена!"
      );
      resetForm();
      await fetchArticles();
      return;
    }

    const slug = makeSlug(title);
    let { error } = await supabase
      .from("articles")
      .insert([{ ...basePayload, slug, views: 0 }]);

    if (
      error &&
      (error.message.toLowerCase().includes("images") ||
        error.message.toLowerCase().includes("collage_layout") ||
        error.message.toLowerCase().includes("views"))
    ) {
      const { images: _i, collage_layout: _c, views: _v, ...fallbackPayload } = {
        ...basePayload,
        views: 0,
      };
      const retry = await supabase
        .from("articles")
        .insert([{ ...fallbackPayload, slug }]);
      error = retry.error;
    }

    setLoading(false);

    if (error) {
      setErrorMsg(
        lang === "kk"
          ? `Сақтау кезінде қате шықты: ${error.message}`
          : `Ошибка при сохранении: ${error.message}`
      );
      return;
    }

    setMessage(
      lang === "kk"
        ? "Мақала сәтті жарияланды! Басты бетке кіріп көре аласыз."
        : "Статья успешно опубликована! Вы можете просмотреть её на главной."
    );
    resetForm();
    await fetchArticles();
  }

  function LangSwitcher() {
    return (
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
    );
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-500 text-sm">
        {lang === "kk" ? "Тексерілуде..." : "Проверка..."}
      </div>
    );
  }

  if (!currentAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">
              {lang === "kk"
                ? "Әл-Фараби атындағы ҚазҰУ"
                : "КазНУ им. аль-Фараби"}
            </p>
            <LangSwitcher />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            {lang === "kk"
              ? "Әкімші бөліміне кіру"
              : "Вход в раздел администратора"}
          </h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            {lang === "kk"
              ? "Мақалаларды қосу, өңдеу және өшіру үшін жеке логин мен құпиясөзіңізді енгізіңіз."
              : "Введите ваш личный логин и пароль для добавления, редактирования и удаления статей."}
          </p>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {lang === "kk" ? "Логин" : "Логин"}
              </label>
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                autoComplete="username"
                placeholder={
                  lang === "kk" ? "Логинді теріңіз..." : "Введите логин..."
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {lang === "kk" ? "Құпиясөз" : "Пароль"}
              </label>
              <input
                type="password"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                autoComplete="current-password"
                placeholder={
                  lang === "kk" ? "Құпиясөзді теріңіз..." : "Введите пароль..."
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-semibold py-2.5 transition cursor-pointer"
            >
              {lang === "kk" ? "Кіру" : "Войти"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              href="/"
              className="text-sm font-medium text-blue-700 hover:underline"
            >
              {lang === "kk" ? "← Басты бетке қайту" : "← На главную"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {editingId !== null
                  ? lang === "kk"
                    ? "Мақаланы өңдеу"
                    : "Редактировать статью"
                  : lang === "kk"
                    ? "Жаңа мақала қосу"
                    : "Добавить статью"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {lang === "kk"
                  ? "Әл-Фараби атындағы ҚазҰУ • Орыс филологиясы және әлем әдебиеті кафедрасы"
                  : "КазНУ им. аль-Фараби • Кафедра русской филологии и мировой литературы"}
              </p>
              <p className="text-xs font-semibold text-[#003366] mt-1.5">
                {lang === "kk"
                  ? `Кірген әкімші: ${currentAdmin.fullName} (@${currentAdmin.username})`
                  : `Администратор: ${currentAdmin.fullName} (@${currentAdmin.username})`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <LangSwitcher />
              <Link
                href="/"
                className="text-sm font-medium text-blue-700 hover:underline"
              >
                {lang === "kk" ? "← Сайтқа қайту" : "← На сайт"}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                {lang === "kk" ? "Шығу" : "Выйти"}
              </button>
            </div>
          </div>

          {message && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
              {message}
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {lang === "kk" ? "Мақала тақырыбы *" : "Заголовок статьи *"}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  lang === "kk"
                    ? "Мысалы: Кафедрада ғылыми семинар өтті"
                    : "Например: На кафедре прошёл научный семинар"
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {lang === "kk" ? "Күні" : "Дата"}
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="24.11.2026"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {lang === "kk" ? "Санат" : "Категория"}
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={
                    lang === "kk" ? "Кафедра жаңалықтары" : "Новости кафедры"
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {lang === "kk"
                  ? "Автор (міндетті емес)"
                  : "Автор (необязательно)"}
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder={currentAdmin.fullName}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <ArticlePhotoUploader
              images={images}
              onChange={setImages}
              maxPhotos={MAX_PHOTOS}
              lang={lang === "ru" ? "ru" : "kk"}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {lang === "kk"
                  ? "Коллаж орналасу түрі:"
                  : "Расположение фото в коллаже:"}
              </label>
              <div className="flex flex-wrap gap-2">
                {COLLAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCollageLayout(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      collageLayout === opt.value
                        ? "bg-[#003366] text-white border-[#003366]"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {lang === "kk" ? opt.kk : opt.ru}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1.5">
                {lang === "kk"
                  ? "Дайын суретті тез қосу:"
                  : "Быстро добавить готовое фото:"}
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    disabled={images.length >= MAX_PHOTOS}
                    onClick={() => {
                      if (
                        images.length < MAX_PHOTOS &&
                        !images.includes(preset.url)
                      ) {
                        setImages((prev) => [...prev, preset.url]);
                      }
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-medium border bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
                  >
                    + {lang === "kk" ? preset.kk : preset.ru}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {lang === "kk" ? "Қысқаша сипаттама *" : "Краткое описание *"}
              </label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={
                  lang === "kk"
                    ? "Басты бетте карточкада көрінетін қысқа мәтін..."
                    : "Краткий текст, который отображается в карточке на главной..."
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {lang === "kk"
                  ? "Мақаланың толық мәтіні *"
                  : "Полный текст статьи *"}
              </label>
              <textarea
                rows={7}
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                placeholder={
                  lang === "kk"
                    ? "Мақала мәтінін осында жазыңыз. Жаңа азатжол үшін Enter басыңыз..."
                    : "Введите текст статьи. Для нового абзаца нажмите Enter..."
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 px-4 transition cursor-pointer"
              >
                {loading
                  ? lang === "kk"
                    ? "Сақталуда..."
                    : "Сохранение..."
                  : editingId !== null
                    ? lang === "kk"
                      ? "Өзгерістерді сақтау"
                      : "Сохранить изменения"
                    : lang === "kk"
                      ? "Мақаланы жариялау"
                      : "Опубликовать статью"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 transition cursor-pointer"
                >
                  {lang === "kk" ? "Болдырмау" : "Отмена"}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              {lang === "kk"
                ? `Жарияланған мақалалар (${articles.length})`
                : `Опубликованные статьи (${articles.length})`}
            </h2>
            <span className="text-xs font-bold text-[#003366] bg-blue-50 px-3 py-1 rounded-full">
              {lang === "kk"
                ? `Барлық қаралым: 👁 ${totalViews}`
                : `Всего просмотров: 👁 ${totalViews}`}
            </span>
          </div>

          {articles.length === 0 ? (
            <p className="text-sm text-slate-500">
              {lang === "kk" ? "Әзірге мақалалар жоқ." : "Статей пока нет."}
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {articles.map((item) => (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.date} • {item.category} • 👁 {item.views ?? 0}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link
                      href={`/articles/${item.slug}`}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition"
                    >
                      {lang === "kk" ? "Көру" : "Открыть"}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      {lang === "kk" ? "Өңдеу" : "Изменить"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer"
                    >
                      {lang === "kk" ? "Өшіру" : "Удалить"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}