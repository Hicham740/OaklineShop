/**
 * Demo data for the admin panel.
 *
 * There is no backend connected yet, so these values are static.
 * When the API is ready, replace this file with database queries.
 */

import { getProduct } from "./products";
import { toDZD } from "./currency";

export const ORDER_STATUSES = [
  "Pending",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type PaymentMethod = "COD" | "CIB" | "EDAHABIA";

export interface OrderLine {
  productId: string;
  name: string;
  qty: number;
  unitPriceDZD: number;
}

export interface OrderHistoryEntry {
  status: OrderStatus;
  date: string;
  note?: string;
}

export interface AdminOrder {
  id: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  date: string;
  lines: OrderLine[];
  payment: PaymentMethod;
  status: OrderStatus;
  history: OrderHistoryEntry[];
  notes: string;
  discountDZD?: number;
}

/** Build an order line from a catalogue product id. */
function line(productId: string, qty: number): OrderLine {
  const product = getProduct(productId);
  return {
    productId,
    name: product?.name ?? productId,
    qty,
    unitPriceDZD: product ? toDZD(product.price) : 0,
  };
}

/** Demo status history for an order created on the given date. */
function history(status: OrderStatus, date: string): OrderHistoryEntry[] {
  const created: OrderHistoryEntry = {
    status: "Pending",
    date: `${date}, 09:30`,
  };

  if (status === "Pending") return [created];

  if (status === "Cancelled") {
    return [
      created,
      {
        status: "Cancelled",
        date: `${date}, 14:10`,
        note: "Customer cancelled by phone.",
      },
    ];
  }

  if (status === "Shipped") {
    return [created, { status: "Shipped", date: `${date}, 16:45` }];
  }

  return [
    created,
    { status: "Shipped", date: `${date}, 16:45` },
    { status: "Delivered", date: `${date}, 18:20` },
  ];
}

export const ADMIN_ORDERS: AdminOrder[] = [
  {
    id: "ORD-1042",
    customer: "Yasmine Benali",
    email: "yasmine.b@example.com",
    phone: "0550 12 34 56",
    address: "12 Rue Didouche Mourad",
    city: "Algiers",
    postalCode: "16000",
    date: "21 Oct 2026",
    lines: [
      line("ceramic-pour-over-set", 1),
      line("linen-throw-blanket", 1),
      line("glass-carafe", 1),
    ],
    payment: "COD",
    status: "Pending",
    history: history("Pending", "21 Oct 2026"),
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
    date: "21 Oct 2026",
    lines: [line("ceramic-pour-over-set", 1)],
    payment: "CIB",
    status: "Shipped",
    history: history("Shipped", "21 Oct 2026"),
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
    date: "20 Oct 2026",
    lines: [line("linen-throw-blanket", 1), line("cotton-bath-towel", 1)],
    payment: "COD",
    status: "Delivered",
    history: history("Delivered", "20 Oct 2026"),
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
    date: "20 Oct 2026",
    lines: [
      line("brass-table-lamp", 1),
      line("wool-floor-cushion", 1),
      line("oak-serving-board", 1),
      line("glass-carafe", 1),
    ],
    payment: "EDAHABIA",
    status: "Delivered",
    history: history("Delivered", "20 Oct 2026"),
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
    date: "19 Oct 2026",
    lines: [line("cotton-bath-towel", 1)],
    payment: "COD",
    status: "Cancelled",
    history: history("Cancelled", "19 Oct 2026"),
    notes: "Customer changed their mind.",
  },
  {
    id: "ORD-1037",
    customer: "Yacine Belaid",
    email: "yacine.b@example.com",
    phone: "0660 44 55 66",
    address: "31 Avenue de l'ALN",
    city: "Sétif",
    postalCode: "19000",
    date: "18 Oct 2026",
    lines: [line("oak-serving-board", 1), line("glass-carafe", 1)],
    payment: "COD",
    status: "Shipped",
    history: history("Shipped", "18 Oct 2026"),
    notes: "",
  },
  {
    id: "ORD-1036",
    customer: "Nadia Saidi",
    email: "nadia.s@example.com",
    phone: "0771 99 88 77",
    address: "5 Rue Emir Abdelkader",
    city: "Tlemcen",
    postalCode: "13000",
    date: "17 Oct 2026",
    lines: [
      line("stoneware-dinner-plate", 2),
      line("cotton-bath-towel", 1),
    ],
    payment: "CIB",
    status: "Delivered",
    history: history("Delivered", "17 Oct 2026"),
    notes: "",
  },
  {
    id: "ORD-1035",
    customer: "Riad Bensalem",
    email: "riad.b@example.com",
    phone: "0552 10 20 30",
    address: "18 Rue Ibn Badis",
    city: "Béjaïa",
    postalCode: "06000",
    date: "16 Oct 2026",
    lines: [line("glass-carafe", 1)],
    payment: "COD",
    status: "Pending",
    history: history("Pending", "16 Oct 2026"),
    notes: "",
  },
  {
    id: "ORD-1034",
    customer: "Meriem Kaci",
    email: "meriem.k@example.com",
    phone: "0663 77 44 11",
    address: "40 Rue Hassiba Ben Bouali",
    city: "Algiers",
    postalCode: "16000",
    date: "15 Oct 2026",
    lines: [
      line("brass-table-lamp", 1),
      line("linen-throw-blanket", 1),
      line("wool-floor-cushion", 1),
      line("ceramic-pour-over-set", 1),
      line("stoneware-dinner-plate", 1),
    ],
    payment: "EDAHABIA",
    status: "Delivered",
    history: history("Delivered", "15 Oct 2026"),
    notes: "Gift order — do not include the receipt.",
  },
  {
    id: "ORD-1033",
    customer: "Walid Brahimi",
    email: "walid.b@example.com",
    phone: "0779 65 43 21",
    address: "11 Rue Larbi Ben M'hidi",
    city: "Oran",
    postalCode: "31000",
    date: "14 Oct 2026",
    lines: [line("linen-throw-blanket", 1), line("cotton-bath-towel", 1)],
    payment: "COD",
    status: "Delivered",
    history: history("Delivered", "14 Oct 2026"),
    notes: "",
  },
  {
    id: "ORD-1032",
    customer: "Sara Mansouri",
    email: "sara.m@example.com",
    phone: "0556 88 99 00",
    address: "3 Rue de la Liberté",
    city: "Batna",
    postalCode: "05000",
    date: "13 Oct 2026",
    lines: [line("oak-serving-board", 1)],
    payment: "CIB",
    status: "Shipped",
    history: history("Shipped", "13 Oct 2026"),
    notes: "",
  },
  {
    id: "ORD-1031",
    customer: "Ilyes Zerrouki",
    email: "ilyes.z@example.com",
    phone: "0664 12 90 78",
    address: "22 Boulevard Stiti",
    city: "Tizi Ouzou",
    postalCode: "15000",
    date: "12 Oct 2026",
    lines: [line("woven-storage-basket", 1), line("glass-carafe", 1)],
    payment: "COD",
    status: "Delivered",
    history: history("Delivered", "12 Oct 2026"),
    notes: "",
  },
];

export function orderSubtotal(order: AdminOrder): number {
  return order.lines.reduce(
    (sum, item) => sum + item.unitPriceDZD * item.qty,
    0,
  );
}

export function orderTotal(order: AdminOrder): number {
  return Math.max(0, orderSubtotal(order) - (order.discountDZD ?? 0));
}

export function orderItemCount(order: AdminOrder): number {
  return order.lines.reduce((sum, item) => sum + item.qty, 0);
}

/** Revenue for the last six months, in DZD. */
export const REVENUE_BY_MONTH = [
  { month: "May", value: 82000 },
  { month: "Jun", value: 96000 },
  { month: "Jul", value: 74000 },
  { month: "Aug", value: 118000 },
  { month: "Sep", value: 134000 },
  { month: "Oct", value: 156750 },
];

/** Units sold per product, used by the "Top products" card. */
export const TOP_PRODUCTS = [
  { id: "ceramic-pour-over-set", sold: 128 },
  { id: "linen-throw-blanket", sold: 96 },
  { id: "oak-serving-board", sold: 74 },
  { id: "glass-carafe", sold: 61 },
  { id: "wool-floor-cushion", sold: 43 },
];

/** Default stock levels (units left) for the demo products. */
export const STOCK_LEVELS: Record<string, number> = {
  "ceramic-pour-over-set": 42,
  "linen-throw-blanket": 27,
  "oak-serving-board": 8,
  "glass-carafe": 6,
  "stoneware-dinner-plate": 64,
  "wool-floor-cushion": 19,
  "brass-table-lamp": 12,
  "cotton-bath-towel": 38,
  "woven-storage-basket": 5,
};
