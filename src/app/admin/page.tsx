"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";

const ADMIN_PASSCODE = "kafedra2026-ph";
const AUTH_STORAGE_KEY = "kafedra_admin_unlocked_v1";
const STORAGE_BUCKET = "articles";

type ArticleRecord = {
  id: number | string;
  slug: string;
  title: string;
  date: string;
  category: string;
  author?: string | null;
  image?: string | null;
  summary: string;
  content: string[] | string | null;
};

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

function getSafeFileExt(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName) return fromName;
  const fromMime = file.type.split("/")[1]?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return fromMime || "jpg";
}

export default function AdminPage() {
  const { lang, setLang } = useLanguage();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("21.11.2026");
  const [category, setCategory] = useState("Кафедра жаңалықтары");
  const [author, setAuthor] = useState("");
  const [image, setImage] = useState(PRESET_IMAGES[0].url);
  const [summary, setSummary] = useState("");
  const [contentText, setContentText] = useState("");

  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const [articles, setArticles] = useState<ArticleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (saved === "1") {
        setIsUnlocked(true);
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
      setArticles(data);
    }
  }

  useEffect(() => {
    if (isUnlocked) {
      fetchArticles();
    }
  }, [isUnlocked]);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);

    if (passInput.trim() === ADMIN_PASSCODE) {
      setIsUnlocked(true);
      setPassInput("");
      try {
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, "1");
      } catch {
        // ignore storage errors
      }
    } else {
      setAuthError(
        lang === "kk"
          ? "Құпиясөз қате. Қайта теріп көріңіз."
          : "Неверный пароль. Попробуйте ещё раз."
      );
    }
  }

  function handleLogout() {
    setIsUnlocked(false);
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
    setDate("21.11.2026");
    setCategory(
      lang === "kk" ? "Кафедра жаңалықтары" : "Новости кафедры"
    );
    setAuthor("");
    setImage(PRESET_IMAGES[0].url);
    setSummary("");
    setContentText("");
  }

  function handleStartEdit(item: ArticleRecord) {
    setMessage(null);
    setErrorMsg(null);
    setEditingId(item.id);
    setEditingSlug(item.slug);
    setTitle(item.title || "");
    setDate(item.date || "21.11.2026");
    setCategory(item.category || "Кафедра жаңалықтары");
    setAuthor(item.author || "");
    setImage(item.image || PRESET_IMAGES[0].url);
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage(null);
    setErrorMsg(null);

    if (!file.type.startsWith("image/")) {
      setErrorMsg(
        lang === "kk"
          ? "Тек сурет файлын таңдаңыз (JPG, PNG, WEBP т.б.)."
          : "Выберите файл изображения (JPG, PNG, WEBP и т.д.)."
      );
      e.target.value = "";
      return;
    }

    const maxSizeBytes = 8 * 1024 * 1024; // 8 MB
    if (file.size > maxSizeBytes) {
      setErrorMsg(
        lang === "kk"
          ? "Сурет көлемі 8 МБ-тан аспауы керек."
          : "Размер изображения не должен превышать 8 МБ."
      );
      e.target.value = "";
      return;
    }

    setUploadingImage(true);

    try {
      const ext = getSafeFileExt(file);
      const uniqueName = `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
      const filePath = `covers/${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        setErrorMsg(
          lang === "kk"
            ? `Суретті жүктеу қатесі: ${uploadError.message}`
            : `Ошибка загрузки изображения: ${uploadError.message}`
        );
        return;
      }

      const { data: publicData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      if (!publicData?.publicUrl) {
        setErrorMsg(
          lang === "kk"
            ? "Жүктелген суреттің сілтемесі алынбады."
            : "Не удалось получить публичную ссылку на изображение."
        );
        return;
      }

      setImage(publicData.publicUrl);
      setMessage(
        lang === "kk"
          ? "Сурет жүктелді! Енді «Мақаланы жариялау» батырмасын басыңыз."
          : "Фото загружено! Теперь нажмите «Опубликовать статью»."
      );
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
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

    if (uploadingImage) {
      setErrorMsg(
        lang === "kk"
          ? "Сурет әлі жүктеліп жатыр, сәл күте тұрыңыз."
          : "Изображение ещё загружается, подождите немного."
      );
      return;
    }

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

    setLoading(true);

    const payload = {
      title: title.trim(),
      date: date.trim() || "2026",
      category:
        category.trim() || (lang === "kk" ? "Жаңалықтар" : "Новости"),
      author: author.trim() || (lang === "kk" ? "Кафедра" : "Кафедра"),
      image: image.trim() || PRESET_IMAGES[0].url,
      summary: summary.trim(),
      content: paragraphs,
    };

    if (editingId !== null) {
      const { error } = await supabase
        .from("articles")
        .update({ ...payload, slug: editingSlug || makeSlug(title) })
        .eq("id", editingId);

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
    const { error } = await supabase
      .from("articles")
      .insert([{ ...payload, slug }]);

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

  if (!isUnlocked) {
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
            {lang === "kk" ? "Әкімші бөліміне кіру" : "Вход в раздел администратора"}
          </h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            {lang === "kk"
              ? "Мақалаларды қосу, өңдеу және өшіру үшін құпиясөзді енгізіңіз."
              : "Введите пароль для добавления, редактирования и удаления статей."}
          </p>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {lang === "kk" ? "Құпиясөз" : "Пароль"}
              </label>
              <input
                type="password"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
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
        {/* Форма бөлімі */}
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
                  placeholder="21.11.2026"
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
                placeholder={
                  lang === "kk"
                    ? "Мысалы: Орыс филологиясы және әлем әдебиеті кафедрасы"
                    : "Например: Кафедра русской филологии и мировой литературы"
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {lang === "kk"
                  ? "Фото жүктеу (ноутбук немесе телефоннан)"
                  : "Загрузить фото (с компьютера или телефона)"}
              </label>
              <input
                type="file"
                accept="image/*"
                disabled={uploadingImage}
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#003366] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[#002244] file:cursor-pointer disabled:opacity-60"
              />
              {uploadingImage && (
                <p className="text-xs text-blue-700 mt-1.5 font-medium">
                  {lang === "kk"
                    ? "Фото жүктеліп жатыр..."
                    : "Фото загружается..."}
                </p>
              )}

              <p className="text-xs font-semibold text-slate-600 mt-3 mb-1.5">
                {lang === "kk"
                  ? "Немесе дайын суретті таңдаңыз / URL жазыңыз:"
                  : "Или выберите готовое фото / вставьте URL:"}
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setImage(preset.url)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      image === preset.url
                        ? "bg-blue-50 border-blue-600 text-blue-800"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {lang === "kk" ? preset.kk : preset.ru}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
              />

              {image && (
                <div className="mt-3">
                  <img
                    src={image}
                    alt="Preview"
                    className="h-40 w-full sm:w-64 object-cover rounded-xl border border-slate-200"
                  />
                </div>
              )}
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
                disabled={loading || uploadingImage}
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

        {/* Жарияланған мақалаларды басқару тізімі */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            {lang === "kk"
              ? `Жарияланған мақалалар (${articles.length})`
              : `Опубликованные статьи (${articles.length})`}
          </h2>

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
                      {item.date} • {item.category}
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