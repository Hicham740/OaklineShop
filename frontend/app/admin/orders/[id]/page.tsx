import { OrderDetails } from "./OrderDetails";

// Admin pages read local demo data and the current path, so render them as a
// blocking route instead of trying to prerender the detail page.
export const instant = false;

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetails id={id} />;
}
