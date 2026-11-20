import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Headlines on the landing page.
const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

// The landing hero's serif headline.
const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "DocFlow — AI document processing", template: "%s · DocFlow" },
  description:
    "Upload PDFs, Word documents and scans. Get summaries, invoice fields and contract metadata in seconds.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
