import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_METHODS } from "./constants";

/**
 * Request validation with Zod.
 *
 * We validate at the edge of the API so route handlers can trust their input.
 * This is the backend equivalent of the client-side checks in the cart page —
 * the client checks improve UX, while these checks protect the database.
 */

const ALGERIAN_PHONE_PATTERN = /^(?:\+213|00213|0)[5-7]\d{8}$/;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(160),
  password: z.string().min(1, "Enter your password.").max(200),
});

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: z.string().trim().email("Enter a valid email address.").max(160),
  phone: z
    .string()
    .trim()
    .regex(ALGERIAN_PHONE_PATTERN, "Enter a valid Algerian mobile number.")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "Use at least 8 characters for your password.")
    .max(200, "Password is too long."),
});

const productBaseSchema = z.object({
  name: z.string().trim().min(1, "Product name is required.").max(120),
  category: z.string().trim().min(1, "Category is required.").max(32),
  price: z.coerce.number().positive("Price must be greater than 0."),
  tint: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour such as #E9E1D3.")
    .optional(),
  image: z.string().trim().max(4_000_000).optional(),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(5_000),
  finish: z.string().trim().max(80).optional(),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  isNew: z.boolean().optional(),
  onSale: z.boolean().optional(),
});

export const createProductSchema = productBaseSchema;
export const updateProductSchema = productBaseSchema.partial().extend({
  // Visibility is only changed from the admin table, not from the product form.
  hidden: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a category name.")
    .max(32, "Category names must be 32 characters or fewer.")
    .refine((value) => !value.includes(","), "Category names cannot contain commas."),
});

export const createOrderSchema = z.object({
  customer: z.object({
    firstName: z.string().trim().min(1, "First name is required.").max(80),
    lastName: z.string().trim().min(1, "Last name is required.").max(80),
    email: z.string().trim().email("Enter a valid email address.").max(160),
    phone: z
      .string()
      .trim()
      .regex(ALGERIAN_PHONE_PATTERN, "Enter a valid Algerian mobile number."),
    address: z.string().trim().min(1, "Address is required.").max(300),
    city: z.string().trim().min(1, "City is required.").max(120),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{5}$/, "Enter a 5-digit postal code."),
  }),
  lines: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Your cart is empty.")
    .max(50),
  payment: z.enum(PAYMENT_METHODS),
  promoCode: z.string().trim().max(40).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const updateOrderNotesSchema = z.object({
  notes: z.string().max(5_000),
});
