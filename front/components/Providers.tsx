"use client";

import { useEffect } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { initAmplitude } from "@/lib/amplitude";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAmplitude();
  }, []);

  return <LanguageProvider>{children}</LanguageProvider>;
}
