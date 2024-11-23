import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Label Management System",
  description: "A system for managing and printing labels",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.css"
          integrity="sha512-2Ojv7tCt+KHXEANyTZnG/TKVDcezFUAALM6ULlKTUWsK+9ZnADRe5R1KmJ42B7n2hA7sjhbhpR++XCa8bdMAw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}