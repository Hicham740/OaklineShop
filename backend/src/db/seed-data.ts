/**
 * Demo data used by `npm run db:seed`.
 *
 * The product values mirror frontend/lib/products.ts. Once you start editing
 * products in the admin, the database becomes the source of truth and reseeding
 * will not overwrite them (the insert uses ON CONFLICT DO NOTHING).
 */

export const SEED_CATEGORIES = ["Living", "Kitchen", "Bedroom", "Outdoor"];

export interface SeedProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  tint: string;
  image: string;
  isNew?: boolean;
  onSale?: boolean;
  finish?: string;
  description: string;
  stock: number;
}

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: "ceramic-pour-over-set",
    name: "Ceramic pour-over set",
    price: 48,
    category: "Kitchen",
    tint: "#E9E1D3",
    image: "/products/ceramic-pour-over-set.jpg",
    isNew: true,
    finish: "Sand",
    description:
      "A dripper, carafe and two cups in glazed stoneware. Made to sit on the counter and be used every morning.",
    stock: 42,
  },
  {
    id: "linen-throw-blanket",
    name: "Linen throw blanket",
    price: 72,
    category: "Living",
    tint: "#DFE6EA",
    image: "/products/linen-throw-blanket.jpg",
    finish: "Fog",
    description:
      "Stonewashed European linen, soft from day one. Generous size for sofas, beds and slow mornings.",
    stock: 27,
  },
  {
    id: "oak-serving-board",
    name: "Oak serving board",
    price: 39,
    category: "Kitchen",
    tint: "#E6DCC9",
    image: "/products/oak-serving-board.jpg",
    finish: "Natural oak",
    description:
      "Solid oak board with a food-safe oil finish. For serving, slicing and gathering around.",
    stock: 8,
  },
  {
    id: "glass-carafe",
    name: "Glass carafe",
    price: 28,
    category: "Kitchen",
    tint: "#DCE7E2",
    image: "/products/glass-carafe.jpg",
    finish: "Clear",
    description:
      "Mouth-blown glass carafe with a balanced pour. Holds a litre, fits the fridge door.",
    stock: 6,
  },
  {
    id: "stoneware-dinner-plate",
    name: "Stoneware dinner plate",
    price: 22,
    category: "Kitchen",
    tint: "#E9EEF2",
    image: "/products/stoneware-dinner-plate.jpg",
    finish: "Chalk",
    description:
      "Everyday stoneware plate with a matte glaze. Dishwasher, microwave and oven safe.",
    stock: 64,
  },
  {
    id: "wool-floor-cushion",
    name: "Wool floor cushion",
    price: 54,
    category: "Living",
    tint: "#E9E1D3",
    image: "/products/wool-floor-cushion.jpg",
    isNew: true,
    finish: "Oat",
    description:
      "Dense wool floor cushion with a removable cover. Extra seating that stacks away neatly.",
    stock: 19,
  },
  {
    id: "brass-table-lamp",
    name: "Brass table lamp",
    price: 96,
    category: "Bedroom",
    tint: "#E7DCC8",
    image: "/products/brass-table-lamp.jpg",
    finish: "Brushed brass",
    description:
      "Warm, dimmable table lamp in brushed brass with a linen shade. Soft light for corners.",
    stock: 12,
  },
  {
    id: "cotton-bath-towel",
    name: "Cotton bath towel",
    price: 24,
    category: "Bedroom",
    tint: "#DCE7E2",
    image: "/products/cotton-bath-towel.jpg",
    finish: "Sage",
    description:
      "Thick, quick-dry organic cotton towel. Gets softer with every wash.",
    stock: 38,
  },
  {
    id: "woven-storage-basket",
    name: "Woven storage basket",
    price: 34,
    category: "Living",
    tint: "#DFE6EA",
    image: "/products/woven-storage-basket.jpg",
    finish: "Seagrass",
    description:
      "Hand-woven seagrass basket with sturdy handles. For throws, toys and everything else.",
    stock: 5,
  },
];

export interface SeedOrder {
  id: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  daysAgo: number;
  lines: { productId: string; qty: number }[];
  payment: "COD" | "CIB" | "EDAHABIA";
  status: "Pending" | "Shipped" | "Delivered" | "Cancelled";
  notes: string;
}

/**
 * Five example orders so the admin dashboard has something to show on the
 * first run. Seeding orders does not reduce stock, because they represent
 * historical sales that are already reflected in the starting stock levels.
 */
export const SEED_ORDERS: SeedOrder[] = [
  {
    id: "ORD-1042",
    customer: "Yasmine Benali",
    email: "yasmine.b@example.com",
    phone: "0550 12 34 56",
    address: "12 Rue Didouche Mourad",
    city: "Algiers",
    postalCode: "16000",
    daysAgo: 1,
    lines: [
      { productId: "ceramic-pour-over-set", qty: 1 },
      { productId: "linen-throw-blanket", qty: 1 },
      { productId: "glass-carafe", qty: 1 },
    ],
    payment: "COD",
    status: "Pending",
    notes: "Customer requested delivery after 5 PM.",
  },
  {
    id: "ORD-1041",
    customer: "Karim Haddad",
    email: "karim.h@example.com",
    phone: "0661 45 78 90",
    address: "24 Boulevard de la Soummam",
    city: "Oran",
    postalCode: "31000",
    daysAgo: 1,
    lines: [{ productId: "ceramic-pour-over-set", qty: 1 }],
    payment: "CIB",
    status: "Shipped",
    notes: "",
  },
  {
    id: "ORD-1040",
    customer: "Amina Cherif",
    email: "amina.c@example.com",
    phone: "0770 33 21 09",
    address: "8 Rue Larbi Ben M'hidi",
    city: "Constantine",
    postalCode: "25000",
    daysAgo: 2,
    lines: [
      { productId: "linen-throw-blanket", qty: 1 },
      { productId: "cotton-bath-towel", qty: 1 },
    ],
    payment: "COD",
    status: "Delivered",
    notes: "",
  },
  {
    id: "ORD-1039",
    customer: "Sofiane Meziane",
    email: "sofiane.m@example.com",
    phone: "0555 87 65 43",
    address: "15 Rue de la Révolution",
    city: "Annaba",
    postalCode: "23000",
    daysAgo: 2,
    lines: [
      { productId: "brass-table-lamp", qty: 1 },
      { productId: "wool-floor-cushion", qty: 1 },
      { productId: "oak-serving-board", qty: 1 },
    ],
    payment: "EDAHABIA",
    status: "Delivered",
    notes: "Call before arriving; the building gate is usually closed.",
  },
  {
    id: "ORD-1038",
    customer: "Lina Bouzid",
    email: "lina.b@example.com",
    phone: "0698 11 22 33",
    address: "7 Rue des Frères Bouadou",
    city: "Blida",
    postalCode: "09000",
    daysAgo: 3,
    lines: [{ productId: "cotton-bath-towel", qty: 1 }],
    payment: "COD",
    status: "Cancelled",
    notes: "Customer changed their mind.",
  },
];
