import type { Metadata } from "next";
import { AppProvider } from "@/components/providers/app-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Folium",
  description: "Folium is a note-taking workspace for pages, drawings, files, and rich writing.",
  openGraph: {
    title: "Folium",
    description: "A modern writing workspace inspired by note-taking apps.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-body">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
