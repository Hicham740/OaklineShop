import { OrderTracking } from "./OrderTracking";

// The order id comes from the URL and data is fetched in the browser from the
// protected customer API, so keep this route blocking.
export const instant = false;

export default async function AccountOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderTracking id={id} />;
}
