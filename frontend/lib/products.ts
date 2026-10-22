/**
 * Categories are plain strings because the admin can add new ones. The list
 * below is only the starting set for the demo catalogue.
 */
export type Category = string;

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  tint: string;
  /** Path to the product photo in the public folder. */
  image: string;
  isNew?: boolean;
  inStock: boolean;
  onSale?: boolean;
  finish?: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  "Living",
  "Kitchen",
  "Bedroom",
  "Outdoor",
];

export const PRODUCTS: Product[] = [
  {
    id: "ceramic-pour-over-set",
    name: "Ceramic pour-over set",
    price: 48,
    category: "Kitchen",
    tint: "#E9E1D3",
    image: "/products/ceramic-pour-over-set.jpg",
    isNew: true,
    inStock: true,
    finish: "Sand",
    description:
      "A dripper, carafe and two cups in glazed stoneware. Made to sit on the counter and be used every morning.",
  },
  {
    id: "linen-throw-blanket",
    name: "Linen throw blanket",
    price: 72,
    category: "Living",
    tint: "#DFE6EA",
    image: "/products/linen-throw-blanket.jpg",
    inStock: true,
    finish: "Fog",
    description:
      "Stonewashed European linen, soft from day one. Generous size for sofas, beds and slow mornings.",
  },
  {
    id: "oak-serving-board",
    name: "Oak serving board",
    price: 39,
    category: "Kitchen",
    tint: "#E6DCC9",
    image: "/products/oak-serving-board.jpg",
    inStock: true,
    finish: "Natural oak",
    description:
      "Solid oak board with a food-safe oil finish. For serving, slicing and gathering around.",
  },
  {
    id: "glass-carafe",
    name: "Glass carafe",
    price: 28,
    category: "Kitchen",
    tint: "#DCE7E2",
    image: "/products/glass-carafe.jpg",
    inStock: true,
    finish: "Clear",
    description:
      "Mouth-blown glass carafe with a balanced pour. Holds a litre, fits the fridge door.",
  },
  {
    id: "stoneware-dinner-plate",
    name: "Stoneware dinner plate",
    price: 22,
    category: "Kitchen",
    tint: "#E9EEF2",
    image: "/products/stoneware-dinner-plate.jpg",
    inStock: true,
    finish: "Chalk",
    description:
      "Everyday stoneware plate with a matte glaze. Dishwasher, microwave and oven safe.",
  },
  {
    id: "wool-floor-cushion",
    name: "Wool floor cushion",
    price: 54,
    category: "Living",
    tint: "#E9E1D3",
    image: "/products/wool-floor-cushion.jpg",
    isNew: true,
    inStock: true,
    finish: "Oat",
    description:
      "Dense wool floor cushion with a removable cover. Extra seating that stacks away neatly.",
  },
  {
    id: "brass-table-lamp",
    name: "Brass table lamp",
    price: 96,
    category: "Bedroom",
    tint: "#E7DCC8",
    image: "/products/brass-table-lamp.jpg",
    inStock: true,
    finish: "Brushed brass",
    description:
      "Warm, dimmable table lamp in brushed brass with a linen shade. Soft light for corners.",
  },
  {
    id: "cotton-bath-towel",
    name: "Cotton bath towel",
    price: 24,
    category: "Bedroom",
    tint: "#DCE7E2",
    image: "/products/cotton-bath-towel.jpg",
    inStock: true,
    finish: "Sage",
    description:
      "Thick, quick-dry organic cotton towel. Gets softer with every wash.",
  },
  {
    id: "woven-storage-basket",
    name: "Woven storage basket",
    price: 34,
    category: "Living",
    tint: "#DFE6EA",
    image: "/products/woven-storage-basket.jpg",
    inStock: true,
    finish: "Seagrass",
    description:
      "Hand-woven seagrass basket with sturdy handles. For throws, toys and everything else.",
  },
];

export const BEST_SELLERS = [
  "ceramic-pour-over-set",
  "linen-throw-blanket",
  "oak-serving-board",
  "glass-carafe",
] as const;

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export { formatPrice } from "./currency";
