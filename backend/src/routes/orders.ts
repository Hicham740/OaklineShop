import { Router } from "express";
import { loadCustomer, requireAdmin } from "../auth";
import {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderNotes,
  updateOrderStatus,
} from "../orders";
import {
  createOrderSchema,
  updateOrderNotesSchema,
  updateOrderStatusSchema,
} from "../validation";

export const ordersRouter = Router();

/**
 * Public checkout endpoint. Guests and signed-in customers both use it; when a
 * customer session is present `loadCustomer` attaches the account and the
 * created order is linked to it, which is what enables order history.
 */
ordersRouter.post("/", loadCustomer, async (req, res) => {
  const input = createOrderSchema.parse(req.body);
  const order = await createOrder(input, req.customer?.id ?? null);
  res.status(201).json({ order });
});

/** Admin: all orders, newest first. */
ordersRouter.get("/", requireAdmin, async (_req, res) => {
  const orders = await listOrders();
  res.json({ orders });
});

/** Admin: one order with its lines and status history. */
ordersRouter.get("/:id", requireAdmin, async (req, res) => {
  const order = await getOrderById(String(req.params.id));
  res.json({ order });
});

/** Admin: change status. Adds a timeline entry when the status changes. */
ordersRouter.patch("/:id/status", requireAdmin, async (req, res) => {
  const { status, note } = updateOrderStatusSchema.parse(req.body);
  const order = await updateOrderStatus(String(req.params.id), status, note);
  res.json({ order });
});

/** Admin: save internal notes. */
ordersRouter.patch("/:id/notes", requireAdmin, async (req, res) => {
  const { notes } = updateOrderNotesSchema.parse(req.body);
  const order = await updateOrderNotes(String(req.params.id), notes);
  res.json({ order });
});
