import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "My Free Personal PDF Editor — Merge, Split & Compress (2026)",
  description: "Every tool you need to use PDFs, at your fingertips. 100% free and easy to use! Give it a try to merge, split, compress, convert, and edit PDFs.",
  keywords: ["100% free", "easy to use", "merge PDF", "split PDF", "compress PDF", "convert PDF", "edit PDF", "PDF editor", "PDF toolkit"],
  openGraph: {
    title: "My Free Personal PDF Editor — Merge, Split & Compress (2026)",
    description: "Every tool you need to use PDFs, at your fingertips. 100% free and easy to use!",
    type: "website",
    url: "https://pdftoolkit.com",
    siteName: "PDF Toolkit",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Free Personal PDF Editor — Merge, Split & Compress (2026)",
    description: "Every tool you need to use PDFs, at your fingertips. 100% free and easy to use!",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400;1,700&family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-sans bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              PDF Toolkit
            </Link>
          </div>
        </header>
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>
        <footer className="bg-white border-t border-gray-200 py-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
            PDF Toolkit — Fast, secure PDF processing.
          </div>
        </footer>
      </body>
    </html>
  );
}
