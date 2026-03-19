import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { AppProvider } from "@/components/providers/app-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Notion Clone",
  description: "Production-ready Notion clone with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${plexMono.variable} min-h-screen font-sans`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
