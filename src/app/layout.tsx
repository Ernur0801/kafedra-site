import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: {
    default:
      "Орыс филологиясы және әлем әдебиеті кафедрасы | Әл-Фараби атындағы ҚазҰУ",
    template: "%s | ҚазҰУ Кафедрасы",
  },
  description:
    "Әл-Фараби атындағы Қазақ ұлттық университеті Филология факультеті — Орыс филологиясы және әлем әдебиеті кафедрасының жаңалықтары мен ғылыми мақалалары.",
  openGraph: {
    title:
      "Орыс филологиясы және әлем әдебиеті кафедрасы | Әл-Фараби атындағы ҚазҰУ",
    description:
      "Кафедраның имидждік мақалалары, ғылыми-әдістемелік жаңалықтары және жарияланымдары.",
    type: "website",
    images: [
      {
        url: "/kaznu-logo.png",
        alt: "Әл-Фараби атындағы ҚазҰУ логотипі",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kk" suppressHydrationWarning>
      <body className="antialiased selection:bg-amber-400/30 selection:text-amber-900 dark:selection:text-amber-200">
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}