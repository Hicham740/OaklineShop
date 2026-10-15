"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { Logo } from "@/components/Logo";

export function Footer({ full = true }: { full?: boolean }) {
  const { t } = useLanguage();
  if (!full) {
    return (
      <footer className="bg-[#14171d] text-white mt-16">
        <div className="mx-auto max-w-[1200px] px-5 py-6 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Logo size={30} />
            <span className="text-xl font-extrabold">Oakline</span>
          </span>
          <span className="text-sm text-white/60">{t.rights}</span>
        </div>
      </footer>
    );
  }
  return (
    <footer className="bg-[#14171d] text-white mt-16">
      <div className="mx-auto max-w-[1200px] px-5 pt-12 pb-6">
        <div className="flex flex-col md:flex-row gap-10 justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Logo size={32} />
              <span className="text-2xl font-extrabold">Oakline</span>
            </div>
            <p className="text-white/60 text-sm mt-2">{t.footerTagline}</p>
          </div>
          <div className="grid grid-cols-3 gap-12 text-sm">
            <div>
              <div className="font-semibold mb-3">{t.shop}</div>
              <ul className="space-y-2 text-white/60">
                <li><Link href="/shop">{t.allProducts}</Link></li>
                <li><Link href="/shop">{t.newArrivals}</Link></li>
                <li><Link href="/shop">{t.giftIdeas}</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3">{t.support}</div>
              <ul className="space-y-2 text-white/60">
                <li>{t.shippingLink}</li>
                <li>{t.returns}</li>
                <li>{t.contact}</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3">{t.company}</div>
              <ul className="space-y-2 text-white/60">
                <li>{t.about}</li>
                <li>{t.careers}</li>
                <li>{t.privacy}</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-10 pt-5 text-[13px] text-white/50">
          {t.rights}
        </div>
      </div>
    </footer>
  );
}
