import type { Metadata } from "next";
import { Instrument_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: '--font-instrument'
});

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-instrument-serif'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains'
});

export const metadata: Metadata = {
  title: "Paxxora - Facial Analysis",
  description: "33 facial measurements. Instant results. Brutal honesty.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen bg-background antialiased`}>
        {children}
      </body>
    </html>
  );
}