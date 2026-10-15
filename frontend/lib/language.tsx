"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "ar";

const en = {
  announcement: "Free shipping on orders over 10,000 دج · Easy returns",
  shopAll: "Shop all",
  search: "Search products",
  secureCheckout: "Secure checkout",
  newSeason: "NEW SEASON",
  heroTitle: "Thoughtfully made goods for everyday living.",
  heroSub:
    "Durable materials, simple shapes and fair prices for the rooms you actually use.",
  shopCollection: "Shop the collection",
  newArrivals: "New arrivals",
  shopByCategory: "Shop by category",
  bestSellers: "Best sellers",
  viewAll: "View all",
  freeShipping: "Free shipping",
  freeShippingSub: "On orders over 10,000 دج",
  easyReturns: "Easy returns",
  easyReturnsSub: "Within 30 days",
  secureCheckoutTitle: "Secure checkout",
  secureCheckoutSub: "Encrypted card payments",
  newsletterTitle: "Get new arrivals first",
  newsletterSub: "One email a month. Unsubscribe any time.",
  subscribe: "Subscribe",
  subscribed: "Thanks — you're on the list.",
  home: "Home",
  category: "Category",
  price: "Price",
  min: "Min",
  max: "Max",
  availability: "Availability",
  inStock: "In stock",
  onSale: "On sale",
  clearFilters: "Clear filters",
  sortBy: "Sort by",
  featured: "Featured",
  priceLowHigh: "Price: Low to High",
  priceHighLow: "Price: High to Low",
  nameSort: "Name",
  productsCount: (n: number) => `${n} products`,
  noResults: "No products match your filters.",
  inStockLabel: "IN STOCK",
  finish: "Finish",
  colour: "Colour",
  addToCart: "Add to cart",
  added: "Added ✓",
  details: "Details",
  detailsText:
    "Materials: glazed stoneware. Dimensions: 24 × 18 × 12 cm. Care: dishwasher safe.",
  shippingReturns: "Shipping and returns",
  shippingReturnsText:
    "Ships in 2 business days. Returns accepted within 30 days.",
  youMayAlsoLike: "You may also like",
  continueShopping: "Continue shopping",
  yourCart: "Your cart",
  emptyCart: "Your cart is empty",
  remove: "Remove",
  shippingDetails: "Shipping details",
  email: "Email",
  firstName: "First name",
  lastName: "Last name",
  address: "Address",
  city: "City",
  postalCode: "Postal code",
  payment: "Payment",
  paymentMethod: "Payment method",
  payCOD: "Cash on delivery",
  payCODSub: "Pay in dinars when you receive your order",
  payCIB: "CIB card",
  payEdahabia: "EDAHABIA card",
  payCardSub: "Pay online in DZD via SATIM",
  codNote: "You pay the courier in cash (DZD) on delivery.",
  cardNote: "You will be redirected to the secure SATIM gateway to pay in dinars.",
  phone: "Phone number",
  cardNumber: "Card number",
  expiry: "Expiry",
  securityCode: "Security code",
  orderSummary: "Order summary",
  promoCode: "Promo code",
  apply: "Apply",
  promoApplied: "Promo applied — 10% off at checkout.",
  subtotal: "Subtotal",
  shipping: "Shipping",
  shippingCalc: "Calculated at next step",
  estimatedTotal: "Estimated total",
  placeOrder: "Place order",
  orderPlaced: "Order placed ✓",
  encryptedNote: "Payments are encrypted. Returns accepted within 30 days.",
  footerTagline: "Well-made goods for everyday living.",
  shop: "Shop",
  allProducts: "All products",
  giftIdeas: "Gift ideas",
  support: "Support",
  shippingLink: "Shipping",
  returns: "Returns",
  contact: "Contact",
  company: "Company",
  about: "About",
  careers: "Careers",
  privacy: "Privacy",
  rights: "© Oakline. All rights reserved.",
  catLiving: "Living",
  catKitchen: "Kitchen",
  catBedroom: "Bedroom",
  catOutdoor: "Outdoor",
  loading: "Loading…",
};

export type Strings = typeof en;

const ar: Strings = {
  announcement: "شحن مجاني للطلبات فوق 10,000 دج · إرجاع سهل",
  shopAll: "تسوّق الكل",
  search: "ابحث عن المنتجات",
  secureCheckout: "دفع آمن",
  newSeason: "الموسم الجديد",
  heroTitle: "منتجات مدروسة لحياتك اليومية.",
  heroSub:
    "خامات متينة وأشكال بسيطة وأسعار عادلة للغرف التي تستخدمها فعلاً.",
  shopCollection: "تسوّق المجموعة",
  newArrivals: "وصل حديثاً",
  shopByCategory: "تسوّق حسب الفئة",
  bestSellers: "الأكثر مبيعاً",
  viewAll: "عرض الكل",
  freeShipping: "شحن مجاني",
  freeShippingSub: "للطلبات فوق 10,000 دج",
  easyReturns: "إرجاع سهل",
  easyReturnsSub: "خلال 30 يوماً",
  secureCheckoutTitle: "دفع آمن",
  secureCheckoutSub: "مدفوعات مشفّرة بالبطاقة",
  newsletterTitle: "كن أول من يعرف بالجديد",
  newsletterSub: "بريد واحد شهرياً. ألغِ الاشتراك في أي وقت.",
  subscribe: "اشترك",
  subscribed: "شكراً — تم اشتراكك.",
  home: "الرئيسية",
  category: "الفئة",
  price: "السعر",
  min: "الأدنى",
  max: "الأقصى",
  availability: "التوفر",
  inStock: "متوفر",
  onSale: "تخفيضات",
  clearFilters: "مسح الفلاتر",
  sortBy: "ترتيب حسب",
  featured: "المميز",
  priceLowHigh: "السعر: من الأقل للأعلى",
  priceHighLow: "السعر: من الأعلى للأقل",
  nameSort: "الاسم",
  productsCount: (n: number) => `${n} منتجات`,
  noResults: "لا توجد منتجات مطابقة للفلاتر.",
  inStockLabel: "متوفر",
  finish: "التشطيب",
  colour: "اللون",
  addToCart: "أضف إلى السلة",
  added: "تمت الإضافة ✓",
  details: "التفاصيل",
  detailsText:
    "الخامات: خزف مصقول. الأبعاد: 24 × 18 × 12 سم. العناية: آمن لغسالة الأطباق.",
  shippingReturns: "الشحن والإرجاع",
  shippingReturnsText:
    "يُشحن خلال يومي عمل. يُقبل الإرجاع خلال 30 يوماً.",
  youMayAlsoLike: "قد يعجبك أيضاً",
  continueShopping: "مواصلة التسوق",
  yourCart: "سلة التسوق",
  emptyCart: "سلّتك فارغة",
  remove: "إزالة",
  shippingDetails: "تفاصيل الشحن",
  email: "البريد الإلكتروني",
  firstName: "الاسم الأول",
  lastName: "اسم العائلة",
  address: "العنوان",
  city: "المدينة",
  postalCode: "الرمز البريدي",
  payment: "الدفع",
  paymentMethod: "طريقة الدفع",
  payCOD: "الدفع عند الاستلام",
  payCODSub: "ادفع بالدينار عند استلام طلبك",
  payCIB: "بطاقة CIB",
  payEdahabia: "بطاقة EDAHABIA",
  payCardSub: "ادفع أونلاين بالدينار عبر SATIM",
  codNote: "تدفع نقداً بالدينار لعامل التوصيل عند الاستلام.",
  cardNote: "سيتم تحويلك إلى بوابة SATIM الآمنة للدفع بالدينار.",
  phone: "رقم الهاتف",
  cardNumber: "رقم البطاقة",
  expiry: "تاريخ الانتهاء",
  securityCode: "رمز الأمان",
  orderSummary: "ملخص الطلب",
  promoCode: "رمز الخصم",
  apply: "تطبيق",
  promoApplied: "تم تطبيق الخصم — 10% عند الدفع.",
  subtotal: "المجموع الفرعي",
  shipping: "الشحن",
  shippingCalc: "يُحسب في الخطوة التالية",
  estimatedTotal: "الإجمالي التقديري",
  placeOrder: "تأكيد الطلب",
  orderPlaced: "تم تأكيد الطلب ✓",
  encryptedNote: "المدفوعات مشفّرة. يُقبل الإرجاع خلال 30 يوماً.",
  footerTagline: "منتجات متقنة لحياتك اليومية.",
  shop: "تسوّق",
  allProducts: "كل المنتجات",
  giftIdeas: "أفكار هدايا",
  support: "الدعم",
  shippingLink: "الشحن",
  returns: "الإرجاع",
  contact: "اتصل بنا",
  company: "الشركة",
  about: "من نحن",
  careers: "وظائف",
  privacy: "الخصوصية",
  rights: "© Oakline. جميع الحقوق محفوظة.",
  catLiving: "المعيشة",
  catKitchen: "المطبخ",
  catBedroom: "غرفة النوم",
  catOutdoor: "الخارجي",
  loading: "جارٍ التحميل…",
};

const dicts: Record<Locale, Strings> = { en, ar };
const STORAGE_KEY = "oakline-locale-v1";

interface LanguageValue {
  locale: Locale;
  t: Strings;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ar" || saved === "en") setLocale(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    }
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const value = useMemo<LanguageValue>(
    () => ({
      locale,
      t: dicts[locale],
      toggle: () => setLocale((l) => (l === "en" ? "ar" : "en")),
    }),
    [locale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
