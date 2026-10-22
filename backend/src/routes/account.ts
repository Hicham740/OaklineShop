import { Router } from "express";
import { requireCustomer } from "../auth";
import { getOrderForCustomer, listOrdersForCustomer } from "../orders";

export const accountRouter = Router();

/**
 * Customer-only order history. The customer id always comes from the session
 * cookie, never from the request body or query string, so a visitor cannot ask
 * for somebody else's orders.
 */

accountRouter.get("/orders", requireCustomer, async (req, res) => {
  const orders = await listOrdersForCustomer(req.customer!.id);
  res.json({ orders });
});

accountRouter.get("/orders/:id", requireCustomer, async (req, res) => {
  const order = await getOrderForCustomer(
    req.customer!.id,
    String(req.params.id),
  );
  res.json({ order });
});
