import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title:
    "FAGULHA · Analisar dependências de módulos sintéticos, ciclos e ordem segura sem executar código",
  description:
    "Analisar dependências de módulos sintéticos, ciclos e ordem segura sem executar código",
  metadataBase: new URL("https://fagulha-gustapaz.starrylinen.chatgpt.site"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "FAGULHA",
    description:
      "Analisar dependências de módulos sintéticos, ciclos e ordem segura sem executar código",
    type: "website",
    locale: "pt_BR",
  },
  icons: { icon: "/favicon.svg" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
