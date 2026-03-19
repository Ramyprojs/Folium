"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";

export function ThemeProvider({ children }: PropsWithChildren): JSX.Element {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemeProvider>
  );
}
