import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "../shared/ui/ToastContainer";

export const metadata: Metadata = {
  title: "Micro-Report — Standalone Dynamic Report Engine",
  description: "Trình thiết kế và xuất báo cáo động lai đa nền tảng (Chapisoft/MASCOM)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
