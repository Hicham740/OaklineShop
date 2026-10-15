import Link from "next/link";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";

function ImageIcon({ large = false }: { large?: boolean }) {
  return (
    <svg
      width={large ? 56 : 32}
      height={large ? 56 : 32}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5b6470"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.6" fill="#5b6470" stroke="none" />
      <path d="m4 18 5.5-5.5 3 3L16 12l4 4" />
    </svg>
  );
}

export function ProductImage({
  tint,
  image,
  alt = "",
  large = false,
  className = "",
}: {
  tint: string;
  image?: string;
  alt?: string;
  large?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{ backgroundColor: tint }}
    >
      {image ? (
        <img
          src={image}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <ImageIcon large={large} />
      )}
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="relative">
        {product.isNew && (
          <span className="absolute left-3 top-3 z-10 bg-[#14171d] text-white text-[13px] font-semibold px-3 py-1 rounded-full">
            New
          </span>
        )}
        <ProductImage
          tint={product.tint}
          image={product.image}
          alt={product.name}
          className="aspect-[3/3.6] rounded-2xl transition-transform group-hover:scale-[1.01]"
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span className="font-medium text-[15px]">{product.name}</span>
        <span className="text-gray-500 text-[15px]">
          {formatPrice(product.price)}
        </span>
      </div>
    </Link>
  );
}
