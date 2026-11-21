import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "Кафедра жаңалықтары • Әл-Фараби атындағы ҚазҰУ",
  description:
    "Орыс филологиясы және әлем әдебиеті кафедрасының жаңалықтар мен жарияланымдар порталы.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kk">
      <body className="antialiased bg-slate-50 text-slate-900">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}