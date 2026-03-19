"use client";

import { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { CustomCursor } from "@/components/effects/custom-cursor";

export function AppProvider({ children }: PropsWithChildren): JSX.Element {
  return (
    <SessionProvider>
      <ThemeProvider>
        <QueryProvider>
          <CustomCursor />
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
