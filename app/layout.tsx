import type { Metadata } from "next";
import { Sora } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  title: "Course Catalog",
  description: "Advanced Web Technologies — course catalog project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sora.variable}>
      <body className="min-h-screen">
        <nav className="flex items-center gap-6 px-6 py-4 border-b border-border">
          <span className="font-heading font-bold text-brand mr-2">
            Course Catalog
          </span>
          <Link href="/" className="hover:text-brand transition-colors">
            Home
          </Link>
          <Link
            href="/courses"
            className="hover:text-brand transition-colors"
          >
            Courses
          </Link>
          <Link
            href="/filter"
            className="hover:text-brand transition-colors"
          >
            Filter
          </Link>
          <Link
            href="/about"
            className="hover:text-brand transition-colors"
          >
            About
          </Link>
        </nav>
        <main className="px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
