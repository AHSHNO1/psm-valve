"use client";
import { ThemeProvider } from "next-themes";
import { createContext, useContext } from "react";

const DictionaryContext = createContext(null);

export function useDictionary() {
  return useContext(DictionaryContext);
}

export default function Providers({ children, locale, dict }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <DictionaryContext.Provider value={{ locale, t: dict }}>
        {children}
      </DictionaryContext.Provider>
    </ThemeProvider>
  );
}
