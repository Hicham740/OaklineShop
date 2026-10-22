"use client";

import { useLanguage } from "@/lib/language";

/**
 * Keyboard users can jump past the header straight into the page content.
 * The link stays visually hidden until it receives focus.
 */
export function SkipLink() {
  const { t } = useLanguage();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[#14171d] focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
    >
      {t.skipToContent}
    </a>
  );
}
