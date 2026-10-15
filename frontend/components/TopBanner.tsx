"use client";

import { useLanguage } from "@/lib/language";

export function TopBanner() {
  const { t } = useLanguage();
  return (
    <div className="bg-[#14171d] text-white text-center text-[13px] leading-5 py-2 px-4">
      {t.announcement}
    </div>
  );
}
