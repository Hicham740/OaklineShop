import { OrderDetails } from "./OrderDetails";

// The order id comes from the URL and the data is fetched in the browser from
// the protected API, so keep this route blocking instead of prerendering it.
export const instant = false;

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetails id={id} />;
}
