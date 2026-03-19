"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { PropsWithChildren } from "react";

export function SessionProvider({ children }: PropsWithChildren): JSX.Element {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
